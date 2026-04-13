import { prisma } from "../prisma";
import {
  performInitialSync,
  performIncrementalSync,
} from "../gmail/sync";

let isRunning = false;

export async function runSyncCycle(): Promise<void> {
  if (isRunning) {
    console.log("[Sync] Sync cycle already running, skipping");
    return;
  }

  isRunning = true;
  console.log("[Sync] Starting sync cycle");

  try {
    const accounts = await prisma.googleAccount.findMany({
      where: { isConnected: true },
      include: { mailbox: true },
    });

    for (const account of accounts) {
      if (!account.mailbox) continue;
      if (account.mailbox.syncStatus === "SYNCING") {
        console.log(
          `[Sync] Skipping ${account.email} - already syncing`
        );
        continue;
      }

      try {
        console.log(`[Sync] Syncing ${account.email}`);

        if (account.mailbox.historyId) {
          await performIncrementalSync(account.id, account.mailbox.id);
        } else {
          await performInitialSync(account.id, account.mailbox.id);
        }

        console.log(`[Sync] Completed sync for ${account.email}`);
      } catch (error) {
        console.error(
          `[Sync] Error syncing ${account.email}:`,
          (error as Error).message
        );
      }

      // Small delay between accounts to avoid burst API usage
      await new Promise((resolve) => setTimeout(resolve, 1000));
    }
  } catch (error) {
    console.error("[Sync] Sync cycle error:", error);
  } finally {
    isRunning = false;
    console.log("[Sync] Sync cycle complete");
  }
}
