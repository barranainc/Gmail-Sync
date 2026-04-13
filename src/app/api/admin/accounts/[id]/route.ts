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

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (user?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const { id } = await params;

  const account = await prisma.googleAccount.findUnique({
    where: { id },
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
      mailbox: {
        include: {
          syncJobs: {
            orderBy: { createdAt: "desc" },
            take: 20,
          },
          labels: true,
          _count: {
            select: { messages: true, threads: true },
          },
        },
      },
    },
  });

  if (!account) {
    return Response.json({ error: "Account not found" }, { status: 404 });
  }

  return Response.json(account);
}
