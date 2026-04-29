import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGmailClient, withRetry } from "@/lib/gmail/client";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
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

  const { id } = await params;
  const body = await request.json().catch(() => ({}));
  const olderThanDays = body.olderThanDays ?? 30;
  const maxEmails = body.maxEmails ?? 500;

  const account = await prisma.googleAccount.findUnique({
    where: { id },
    include: { mailbox: true },
  });

  if (!account || !account.isConnected) {
    return Response.json({ error: "Account not found or disconnected" }, { status: 404 });
  }

  await prisma.auditLog.create({
    data: {
      userId: session.user.id as string,
      action: "BULK_TRASH",
      target: account.email,
      details: { olderThanDays, maxEmails },
    },
  });

  try {
    const gmail = await getGmailClient(account.id);

    // Build query: emails older than X days, not already in trash
    const beforeDate = new Date();
    beforeDate.setDate(beforeDate.getDate() - olderThanDays);
    const beforeEpoch = Math.floor(beforeDate.getTime() / 1000);
    const query = `before:${beforeEpoch} -in:trash -in:spam`;

    // Fetch message IDs from Gmail
    let pageToken: string | undefined;
    const messageIds: string[] = [];

    do {
      const res = await withRetry(() =>
        gmail.users.messages.list({
          userId: "me",
          q: query,
          maxResults: 500,
          pageToken,
        })
      );

      const msgs = res.data.messages ?? [];
      messageIds.push(...msgs.map((m) => m.id!).filter(Boolean));
      pageToken = res.data.nextPageToken ?? undefined;
    } while (pageToken && messageIds.length < maxEmails);

    const toTrash = messageIds.slice(0, maxEmails);

    if (toTrash.length === 0) {
      return Response.json({ trashed: 0, message: "No emails found matching criteria" });
    }

    // Trash in batches of 50
    let trashed = 0;
    const batchSize = 50;

    for (let i = 0; i < toTrash.length; i += batchSize) {
      const batch = toTrash.slice(i, i + batchSize);
      await Promise.all(
        batch.map((msgId) =>
          withRetry(() =>
            gmail.users.messages.trash({ userId: "me", id: msgId })
          ).catch(() => null) // skip individual failures
        )
      );
      trashed += batch.length;
    }

    // Also remove from our DB
    if (account.mailbox) {
      await prisma.message.deleteMany({
        where: {
          mailboxId: account.mailbox.id,
          internalDate: { lt: beforeDate },
        },
      });
    }

    return Response.json({
      trashed,
      message: `Moved ${trashed} emails to Trash. The account owner must empty their Gmail Trash to fully recover storage.`,
    });
  } catch (error) {
    return Response.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}
