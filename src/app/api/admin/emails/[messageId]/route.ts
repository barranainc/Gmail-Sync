import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  _request: NextRequest,
  { params }: { params: Promise<{ messageId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
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
