import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

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
  });

  if (!account) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }

  await prisma.googleAccount.update({
    where: { id },
    data: {
      isConnected: false,
      disconnectedAt: new Date(),
    },
  });

  await prisma.auditLog.create({
    data: {
      userId: session.user.id,
      action: "DISCONNECT_ACCOUNT",
      target: account.email,
      details: { googleAccountId: id },
    },
  });

  return Response.json({ status: "disconnected" });
}
