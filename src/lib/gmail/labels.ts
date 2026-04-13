import { prisma } from "../prisma";
import { getGmailClient, withRetry } from "./client";

export async function syncLabels(
  googleAccountId: string,
  mailboxId: string
): Promise<void> {
  const gmail = await getGmailClient(googleAccountId);

  const response = await withRetry(() =>
    gmail.users.labels.list({ userId: "me" })
  );

  const labels = response.data.labels || [];

  for (const label of labels) {
    if (!label.id || !label.name) continue;

    await prisma.label.upsert({
      where: {
        mailboxId_gmailLabelId: {
          mailboxId,
          gmailLabelId: label.id,
        },
      },
      create: {
        mailboxId,
        gmailLabelId: label.id,
        name: label.name,
        type: label.type || "user",
        color: label.color?.backgroundColor || null,
      },
      update: {
        name: label.name,
        type: label.type || "user",
        color: label.color?.backgroundColor || null,
      },
    });
  }
}
