import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const googleAccounts = await prisma.googleAccount.findMany({
    where: { userId: session.user.id, isConnected: true },
    include: { mailbox: true },
  });

  const mailboxIds = googleAccounts
    .map((a) => a.mailbox?.id)
    .filter(Boolean) as string[];

  const email = await prisma.message.findFirst({
    where: {
      id,
      mailboxId: { in: mailboxIds },
    },
    include: {
      participants: true,
      attachments: true,
    },
  });

  if (!email) {
    return Response.json({ error: "Email not found" }, { status: 404 });
  }

  return Response.json(email);
}
