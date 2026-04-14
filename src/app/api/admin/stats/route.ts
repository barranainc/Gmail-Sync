import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id as string },
  });
  if (user?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    connectedAccounts,
    totalMessages,
    activeSyncs,
    recentFailedJobs,
  ] = await Promise.all([
    prisma.googleAccount.count({ where: { isConnected: true } }),
    prisma.message.count(),
    prisma.mailbox.count({ where: { syncStatus: "SYNCING" } }),
    prisma.syncJob.count({
      where: {
        status: "FAILED",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return Response.json({
    connectedAccounts,
    totalMessages,
    activeSyncs,
    recentFailedJobs,
  });
}
