import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { performInitialSync, performIncrementalSync } from "@/lib/gmail/sync";

export async function POST() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const googleAccounts = await prisma.googleAccount.findMany({
    where: { userId: session.user.id, isConnected: true },
    include: { mailbox: true },
  });

  const results = [];

  for (const account of googleAccounts) {
    if (!account.mailbox) continue;
    if (account.mailbox.syncStatus === "SYNCING") {
      results.push({
        email: account.email,
        status: "already_syncing",
      });
      continue;
    }

    try {
      if (account.mailbox.historyId) {
        await performIncrementalSync(account.id, account.mailbox.id);
      } else {
        await performInitialSync(account.id, account.mailbox.id);
      }
      results.push({ email: account.email, status: "completed" });
    } catch (error) {
      results.push({
        email: account.email,
        status: "error",
        error: (error as Error).message,
      });
    }
  }

  return Response.json({ results });
}
