import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const googleAccounts = await prisma.googleAccount.findMany({
    where: { userId: session.user.id, isConnected: true },
    include: { mailbox: true },
  });

  const mailboxIds = googleAccounts
    .map((a) => a.mailbox?.id)
    .filter(Boolean) as string[];

  const labels = await prisma.label.findMany({
    where: { mailboxId: { in: mailboxIds } },
    orderBy: { name: "asc" },
  });

  return Response.json(labels);
}
