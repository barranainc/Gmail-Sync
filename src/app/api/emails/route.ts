import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const label = searchParams.get("label") || "";
  const unreadOnly = searchParams.get("unread") === "true";
  const mailboxId = searchParams.get("mailboxId") || "";

  // Get user's mailboxes
  const googleAccounts = await prisma.googleAccount.findMany({
    where: { userId: session.user.id, isConnected: true },
    include: { mailbox: true },
  });

  const mailboxIds = mailboxId
    ? [mailboxId]
    : googleAccounts
        .map((a) => a.mailbox?.id)
        .filter(Boolean) as string[];

  if (mailboxIds.length === 0) {
    return Response.json({ emails: [], total: 0, page, limit });
  }

  const where: Record<string, unknown> = {
    mailboxId: { in: mailboxIds },
  };

  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { fromEmail: { contains: search, mode: "insensitive" } },
      { fromName: { contains: search, mode: "insensitive" } },
      { snippet: { contains: search, mode: "insensitive" } },
      { bodyText: { contains: search, mode: "insensitive" } },
    ];
  }

  if (label) {
    where.labelIds = { has: label };
  }

  if (unreadOnly) {
    where.isRead = false;
  }

  const [emails, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { internalDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        attachments: { select: { id: true, filename: true, mimeType: true, size: true } },
      },
    }),
    prisma.message.count({ where }),
  ]);

  return Response.json({
    emails,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}
