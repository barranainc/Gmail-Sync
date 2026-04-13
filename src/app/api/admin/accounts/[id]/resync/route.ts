import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { performInitialSync, performIncrementalSync } from "@/lib/gmail/sync";

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
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

  const { id } = await params;

  const account = await prisma.googleAccount.findUnique({
    where: { id },
    include: { mailbox: true },
  });

  if (!account) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }

  if (!account.isConnected) {
    return Response.json({ error: "Account is disconnected" }, { status: 400 });
  }

  if (!account.mailbox) {
    return Response.json({ error: "No mailbox found" }, { status: 400 });
  }

  // Log admin action
  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "MANUAL_RESYNC",
      target: account.email,
      details: { googleAccountId: id },
    },
  });

  try {
    const result = account.mailbox.historyId
      ? await performIncrementalSync(account.id, account.mailbox.id)
      : await performInitialSync(account.id, account.mailbox.id);

    return Response.json({ status: "completed", result });
  } catch (error) {
    return Response.json(
      { status: "error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
