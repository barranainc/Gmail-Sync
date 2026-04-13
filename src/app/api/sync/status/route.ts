import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const googleAccounts = await prisma.googleAccount.findMany({
    where: { userId: session.user.id, isConnected: true },
    include: {
      mailbox: {
        include: {
          syncJobs: {
            orderBy: { createdAt: "desc" },
            take: 5,
          },
        },
      },
    },
  });

  const statuses = googleAccounts.map((account) => ({
    email: account.email,
    isConnected: account.isConnected,
    mailbox: account.mailbox
      ? {
          syncStatus: account.mailbox.syncStatus,
          lastSyncAt: account.mailbox.lastSyncAt,
          lastError: account.mailbox.lastError,
          totalMessages: account.mailbox.totalMessages,
          recentJobs: account.mailbox.syncJobs,
        }
      : null,
  }));

  return Response.json({ accounts: statuses });
}
