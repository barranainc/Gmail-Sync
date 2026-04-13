import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ threadId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { threadId } = await params;

  const googleAccounts = await prisma.googleAccount.findMany({
    where: { userId: session.user.id, isConnected: true },
    include: { mailbox: true },
  });

  const mailboxIds = googleAccounts
    .map((a) => a.mailbox?.id)
    .filter(Boolean) as string[];

  const thread = await prisma.thread.findFirst({
    where: {
      id: threadId,
      mailboxId: { in: mailboxIds },
    },
    include: {
      messages: {
        orderBy: { internalDate: "asc" },
        include: {
          participants: true,
          attachments: true,
        },
      },
    },
  });

  if (!thread) {
    return Response.json({ error: "Thread not found" }, { status: 404 });
  }

  return Response.json(thread);
}
