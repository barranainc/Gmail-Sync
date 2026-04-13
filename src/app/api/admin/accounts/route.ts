import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Check admin role
  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
  });
  if (user?.role !== "ADMIN") {
    return Response.json({ error: "Forbidden" }, { status: 403 });
  }

  const accounts = await prisma.googleAccount.findMany({
    include: {
      user: { select: { id: true, email: true, name: true, role: true } },
      mailbox: {
        include: {
          syncJobs: {
            orderBy: { createdAt: "desc" },
            take: 1,
          },
          _count: {
            select: { messages: true, threads: true },
          },
        },
      },
    },
    orderBy: { connectedAt: "desc" },
  });

  return Response.json({ accounts });
}
