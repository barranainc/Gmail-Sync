import { runSyncCycle } from "@/lib/sync/scheduler";

// This endpoint can be called by an external cron service
// or internally by the app's scheduler
export async function GET(request: Request) {
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  // If CRON_SECRET is set, validate it
  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await runSyncCycle();
    return Response.json({ status: "completed" });
  } catch (error) {
    return Response.json(
      { status: "error", error: (error as Error).message },
      { status: 500 }
    );
  }
}
