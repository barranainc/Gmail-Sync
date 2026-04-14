import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { getGmailClient, withRetry } from "@/lib/gmail/client";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
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

  const { messageId } = await params;

  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      participants: true,
      attachments: true,
      mailbox: {
        select: {
          email: true,
          googleAccount: {
            select: { email: true, displayName: true },
          },
        },
      },
    },
  });

  if (!message) {
    return Response.json({ error: "Message not found" }, { status: 404 });
  }

  return Response.json(message);
}

export async function DELETE(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
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

  const { messageId } = await params;

  // Find the message and its associated Google account
  const message = await prisma.message.findUnique({
    where: { id: messageId },
    include: {
      mailbox: {
        include: {
          googleAccount: true,
        },
      },
    },
  });

  if (!message) {
    return Response.json({ error: "Message not found" }, { status: 404 });
  }

  const googleAccount = message.mailbox?.googleAccount;

  // Trash the email in Gmail via API (moves to Trash, not permanent delete)
  if (googleAccount && message.gmailMessageId) {
    try {
      const gmail = await getGmailClient(googleAccount.id);
      await withRetry(() =>
        gmail.users.messages.trash({
          userId: "me",
          id: message.gmailMessageId,
        })
      );
    } catch (err) {
      console.error("Failed to trash email in Gmail:", err);
      // Continue to delete from our DB even if Gmail API fails
    }
  }

  // Delete from our database
  await prisma.message.delete({ where: { id: messageId } });

  return Response.json({ success: true });
}
