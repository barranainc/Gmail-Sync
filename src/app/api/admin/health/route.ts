import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (user?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const [
    totalAccounts,
    connectedAccounts,
    disconnectedAccounts,
    totalMessages,
    totalThreads,
    activeSyncs,
    errorMailboxes,
    recentFailedJobs,
  ] = await Promise.all([
    prisma.googleAccount.count(),
    prisma.googleAccount.count({ where: { isConnected: true } }),
    prisma.googleAccount.count({ where: { isConnected: false } }),
    prisma.message.count(),
    prisma.thread.count(),
    prisma.mailbox.count({ where: { syncStatus: "SYNCING" } }),
    prisma.mailbox.count({ where: { syncStatus: "ERROR" } }),
    prisma.syncJob.count({
      where: {
        status: "FAILED",
        createdAt: { gte: new Date(Date.now() - 24 * 60 * 60 * 1000) },
      },
    }),
  ]);

  return Response.json({
    totalAccounts,
    connectedAccounts,
    disconnectedAccounts,
    totalMessages,
    totalThreads,
    activeSyncs,
    errorMailboxes,
    recentFailedJobs,
  });
}
