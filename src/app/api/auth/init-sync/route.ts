import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { performInitialSync } from "@/lib/gmail/sync";

// Called after OAuth to trigger initial sync for newly connected accounts
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
    if (!account.mailbox) {
      // Create mailbox if it doesn't exist
      const mailbox = await prisma.mailbox.create({
        data: {
          googleAccountId: account.id,
          email: account.email,
        },
      });

      try {
        await performInitialSync(account.id, mailbox.id);
        results.push({ email: account.email, status: "synced" });
      } catch (error) {
        results.push({
          email: account.email,
          status: "error",
          error: (error as Error).message,
        });
      }
    } else if (!account.mailbox.historyId) {
      // Mailbox exists but hasn't been synced yet
      try {
        await performInitialSync(account.id, account.mailbox.id);
        results.push({ email: account.email, status: "synced" });
      } catch (error) {
        results.push({
          email: account.email,
          status: "error",
          error: (error as Error).message,
        });
      }
    } else {
      results.push({ email: account.email, status: "already_synced" });
    }
  }

  return Response.json({ results });
}
