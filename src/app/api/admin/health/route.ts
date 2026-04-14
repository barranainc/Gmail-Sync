import { prisma } from "@/lib/prisma";

// Public health check endpoint — no auth required (used by Railway)
export async function GET() {
  try {
    // Simple DB ping to confirm connectivity
    await prisma.$queryRaw`SELECT 1`;
    return Response.json({ status: "ok" }, { status: 200 });
  } catch {
    return Response.json({ status: "error", detail: "db unreachable" }, { status: 503 });
  }
}
