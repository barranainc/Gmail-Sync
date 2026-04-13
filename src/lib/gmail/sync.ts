import { prisma } from "../prisma";
import { getGmailClient, withRetry } from "./client";
import { parseGmailMessage } from "./parser";
import { syncLabels } from "./labels";
import { SyncResult } from "@/types";
import { SyncJobType, ParticipantType } from "@/generated/prisma";

const BATCH_SIZE = 100;

async function storeMessage(
  mailboxId: string,
  parsed: ReturnType<typeof parseGmailMessage>
): Promise<void> {
  // Upsert thread
  const thread = await prisma.thread.upsert({
    where: {
      mailboxId_gmailThreadId: {
        mailboxId,
        gmailThreadId: parsed.gmailThreadId,
      },
    },
    create: {
      mailboxId,
      gmailThreadId: parsed.gmailThreadId,
      snippet: parsed.snippet,
      lastMessageAt: parsed.internalDate,
      isRead: parsed.isRead,
      messageCount: 1,
    },
    update: {
      snippet: parsed.snippet,
      lastMessageAt: parsed.internalDate,
      isRead: parsed.isRead,
      messageCount: { increment: 0 }, // Will recalculate below
    },
  });

  // Upsert message
  await prisma.message.upsert({
    where: {
      mailboxId_gmailMessageId: {
        mailboxId,
        gmailMessageId: parsed.gmailMessageId,
      },
    },
    create: {
      threadId: thread.id,
      mailboxId,
      gmailMessageId: parsed.gmailMessageId,
      gmailThreadId: parsed.gmailThreadId,
      subject: parsed.subject,
      snippet: parsed.snippet,
      fromEmail: parsed.fromEmail,
      fromName: parsed.fromName,
      toEmails: parsed.toEmails,
      ccEmails: parsed.ccEmails,
      bccEmails: parsed.bccEmails,
      bodyText: parsed.bodyText,
      bodyHtml: parsed.bodyHtml,
      internalDate: parsed.internalDate,
      labelIds: parsed.labelIds,
      isRead: parsed.isRead,
      isStarred: parsed.isStarred,
      sizeEstimate: parsed.sizeEstimate,
      headers: parsed.headers,
      participants: {
        create: parsed.participants.map((p) => ({
          email: p.email,
          name: p.name,
          type: p.type as ParticipantType,
        })),
      },
      attachments: {
        create: parsed.attachments.map((a) => ({
          gmailAttachmentId: a.gmailAttachmentId,
          filename: a.filename,
          mimeType: a.mimeType,
          size: a.size,
        })),
      },
    },
    update: {
      subject: parsed.subject,
      snippet: parsed.snippet,
      fromEmail: parsed.fromEmail,
      fromName: parsed.fromName,
      toEmails: parsed.toEmails,
      ccEmails: parsed.ccEmails,
      bccEmails: parsed.bccEmails,
      bodyText: parsed.bodyText,
      bodyHtml: parsed.bodyHtml,
      labelIds: parsed.labelIds,
      isRead: parsed.isRead,
      isStarred: parsed.isStarred,
      headers: parsed.headers,
    },
  });

  // Update thread message count
  const messageCount = await prisma.message.count({
    where: { mailboxId, gmailThreadId: parsed.gmailThreadId },
  });

  await prisma.thread.update({
    where: { id: thread.id },
    data: { messageCount },
  });
}

export async function performInitialSync(
  googleAccountId: string,
  mailboxId: string
): Promise<SyncResult> {
  const maxMessages = parseInt(process.env.INITIAL_SYNC_COUNT || "500");
  const gmail = await getGmailClient(googleAccountId);

  const result: SyncResult = {
    messagesProcessed: 0,
    threadsProcessed: 0,
    errors: [],
    newHistoryId: null,
  };

  // Create sync job
  const syncJob = await prisma.syncJob.create({
    data: {
      mailboxId,
      type: SyncJobType.INITIAL,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    // Update mailbox status
    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: { syncStatus: "SYNCING" },
    });

    // Sync labels first
    await syncLabels(googleAccountId, mailboxId);

    // Fetch message IDs
    let pageToken: string | undefined;
    const messageIds: string[] = [];

    while (messageIds.length < maxMessages) {
      const listResponse = await withRetry(() =>
        gmail.users.messages.list({
          userId: "me",
          maxResults: Math.min(BATCH_SIZE, maxMessages - messageIds.length),
          pageToken,
        })
      );

      const messages = listResponse.data.messages || [];
      for (const msg of messages) {
        if (msg.id) messageIds.push(msg.id);
      }

      pageToken = listResponse.data.nextPageToken ?? undefined;
      if (!pageToken) break;
    }

    // Fetch full messages in batches
    for (let i = 0; i < messageIds.length; i += 10) {
      const batch = messageIds.slice(i, i + 10);

      await Promise.all(
        batch.map(async (msgId) => {
          try {
            const msgResponse = await withRetry(() =>
              gmail.users.messages.get({
                userId: "me",
                id: msgId,
                format: "full",
              })
            );

            const parsed = parseGmailMessage(msgResponse.data);
            await storeMessage(mailboxId, parsed);
            result.messagesProcessed++;

            // Capture the highest historyId
            if (msgResponse.data.historyId) {
              if (
                !result.newHistoryId ||
                BigInt(msgResponse.data.historyId) >
                  BigInt(result.newHistoryId)
              ) {
                result.newHistoryId = msgResponse.data.historyId;
              }
            }
          } catch (error) {
            result.errors.push(
              `Failed to fetch message ${msgId}: ${(error as Error).message}`
            );
          }
        })
      );

      // Update sync job progress
      await prisma.syncJob.update({
        where: { id: syncJob.id },
        data: { messagesProcessed: result.messagesProcessed },
      });
    }

    // Get profile for historyId if not captured from messages
    if (!result.newHistoryId) {
      const profile = await withRetry(() =>
        gmail.users.getProfile({ userId: "me" })
      );
      result.newHistoryId = profile.data.historyId?.toString() ?? null;
    }

    // Update mailbox
    const threadCount = await prisma.thread.count({ where: { mailboxId } });
    result.threadsProcessed = threadCount;

    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: {
        historyId: result.newHistoryId,
        totalMessages: result.messagesProcessed,
        syncStatus: "IDLE",
        lastSyncAt: new Date(),
        lastError: null,
      },
    });

    // Complete sync job
    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        messagesProcessed: result.messagesProcessed,
        metadata: {
          threadsProcessed: result.threadsProcessed,
          errors: result.errors,
        },
      },
    });
  } catch (error) {
    const errorMessage = (error as Error).message;

    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: {
        syncStatus: "ERROR",
        lastError: errorMessage,
      },
    });

    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: errorMessage,
        messagesProcessed: result.messagesProcessed,
      },
    });

    throw error;
  }

  return result;
}

export async function performIncrementalSync(
  googleAccountId: string,
  mailboxId: string
): Promise<SyncResult> {
  const gmail = await getGmailClient(googleAccountId);

  const mailbox = await prisma.mailbox.findUnique({
    where: { id: mailboxId },
  });

  if (!mailbox?.historyId) {
    return performInitialSync(googleAccountId, mailboxId);
  }

  const result: SyncResult = {
    messagesProcessed: 0,
    threadsProcessed: 0,
    errors: [],
    newHistoryId: mailbox.historyId,
  };

  const syncJob = await prisma.syncJob.create({
    data: {
      mailboxId,
      type: SyncJobType.INCREMENTAL,
      status: "RUNNING",
      startedAt: new Date(),
    },
  });

  try {
    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: { syncStatus: "SYNCING" },
    });

    let pageToken: string | undefined;
    const processedMessageIds = new Set<string>();

    do {
      let historyResponse;
      try {
        historyResponse = await withRetry(() =>
          gmail.users.history.list({
            userId: "me",
            startHistoryId: mailbox.historyId!,
            pageToken,
            historyTypes: [
              "messageAdded",
              "messageDeleted",
              "labelAdded",
              "labelRemoved",
            ],
          })
        );
      } catch (error: unknown) {
        // If history is invalid (e.g., too old), fall back to initial sync
        if ((error as { code?: number }).code === 404) {
          console.log(
            `History ID expired for mailbox ${mailboxId}, performing full sync`
          );
          await prisma.syncJob.update({
            where: { id: syncJob.id },
            data: { status: "FAILED", error: "History ID expired", completedAt: new Date() },
          });
          return performInitialSync(googleAccountId, mailboxId);
        }
        throw error;
      }

      const history = historyResponse.data.history || [];

      for (const record of history) {
        // Handle added messages
        if (record.messagesAdded) {
          for (const added of record.messagesAdded) {
            const msgId = added.message?.id;
            if (!msgId || processedMessageIds.has(msgId)) continue;
            processedMessageIds.add(msgId);

            try {
              const msgResponse = await withRetry(() =>
                gmail.users.messages.get({
                  userId: "me",
                  id: msgId,
                  format: "full",
                })
              );

              const parsed = parseGmailMessage(msgResponse.data);
              await storeMessage(mailboxId, parsed);
              result.messagesProcessed++;
            } catch (error) {
              // Message might have been deleted already
              if ((error as { code?: number }).code !== 404) {
                result.errors.push(
                  `Failed to fetch message ${msgId}: ${(error as Error).message}`
                );
              }
            }
          }
        }

        // Handle deleted messages
        if (record.messagesDeleted) {
          for (const deleted of record.messagesDeleted) {
            const msgId = deleted.message?.id;
            if (!msgId) continue;

            await prisma.message.deleteMany({
              where: { mailboxId, gmailMessageId: msgId },
            });
          }
        }

        // Handle label changes
        if (record.labelsAdded) {
          for (const labelChange of record.labelsAdded) {
            const msgId = labelChange.message?.id;
            const labels = labelChange.labelIds;
            if (!msgId || !labels) continue;

            const existingMsg = await prisma.message.findFirst({
              where: { mailboxId, gmailMessageId: msgId },
            });

            if (existingMsg) {
              const newLabels = [
                ...new Set([...existingMsg.labelIds, ...labels]),
              ];
              await prisma.message.update({
                where: { id: existingMsg.id },
                data: {
                  labelIds: newLabels,
                  isRead: !newLabels.includes("UNREAD"),
                  isStarred: newLabels.includes("STARRED"),
                },
              });
            }
          }
        }

        if (record.labelsRemoved) {
          for (const labelChange of record.labelsRemoved) {
            const msgId = labelChange.message?.id;
            const labels = labelChange.labelIds;
            if (!msgId || !labels) continue;

            const existingMsg = await prisma.message.findFirst({
              where: { mailboxId, gmailMessageId: msgId },
            });

            if (existingMsg) {
              const newLabels = existingMsg.labelIds.filter(
                (l) => !labels.includes(l)
              );
              await prisma.message.update({
                where: { id: existingMsg.id },
                data: {
                  labelIds: newLabels,
                  isRead: !newLabels.includes("UNREAD"),
                  isStarred: newLabels.includes("STARRED"),
                },
              });
            }
          }
        }
      }

      if (historyResponse.data.historyId) {
        result.newHistoryId = historyResponse.data.historyId;
      }

      pageToken = historyResponse.data.nextPageToken ?? undefined;
    } while (pageToken);

    // Sync labels periodically
    await syncLabels(googleAccountId, mailboxId);

    // Update mailbox
    const totalMessages = await prisma.message.count({ where: { mailboxId } });

    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: {
        historyId: result.newHistoryId,
        totalMessages,
        syncStatus: "IDLE",
        lastSyncAt: new Date(),
        lastError: null,
      },
    });

    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: "COMPLETED",
        completedAt: new Date(),
        messagesProcessed: result.messagesProcessed,
        metadata: { errors: result.errors },
      },
    });
  } catch (error) {
    const errorMessage = (error as Error).message;

    await prisma.mailbox.update({
      where: { id: mailboxId },
      data: {
        syncStatus: "ERROR",
        lastError: errorMessage,
      },
    });

    await prisma.syncJob.update({
      where: { id: syncJob.id },
      data: {
        status: "FAILED",
        completedAt: new Date(),
        error: errorMessage,
        messagesProcessed: result.messagesProcessed,
      },
    });

    throw error;
  }

  return result;
}
