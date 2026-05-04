import { NextRequest } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(request: NextRequest) {
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

  const searchParams = request.nextUrl.searchParams;
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const search = searchParams.get("search") || "";
  const accountId = searchParams.get("accountId") || "";
  const folder = searchParams.get("folder") || "inbox"; // inbox | sent | all

  const where: Record<string, unknown> = {};

  if (accountId) {
    const account = await prisma.googleAccount.findUnique({
      where: { id: accountId },
      include: { mailbox: true },
    });
    if (account?.mailbox) {
      where.mailboxId = account.mailbox.id;
    }
  }

  // Folder filter using Gmail label IDs stored in labelIds array
  if (folder === "sent") {
    where.labelIds = { array_contains: "SENT" };
  } else if (folder === "inbox") {
    where.labelIds = { array_contains: "INBOX" };
  }
  // folder === "all" → no label filter

  if (search) {
    where.OR = [
      { subject: { contains: search, mode: "insensitive" } },
      { fromEmail: { contains: search, mode: "insensitive" } },
      { fromName: { contains: search, mode: "insensitive" } },
      { snippet: { contains: search, mode: "insensitive" } },
    ];
  }

  const [emails, total] = await Promise.all([
    prisma.message.findMany({
      where,
      orderBy: { internalDate: "desc" },
      skip: (page - 1) * limit,
      take: limit,
      include: {
        mailbox: {
          select: {
            email: true,
          },
        },
        attachments: {
          select: { id: true, filename: true, mimeType: true, size: true },
        },
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
