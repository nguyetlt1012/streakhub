import { NextResponse } from "next/server";
import { processAllMissedDays } from "@/lib/streaks/streak-engine";
import { sendStreakAlerts } from "@/lib/telegram/notify";

export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json(
      { error: "CRON_SECRET is not configured." },
      { status: 500 },
    );
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const result = await processAllMissedDays({ collectAlerts: true });
  const alertsSent = await sendStreakAlerts(result.alerts);

  return NextResponse.json({
    ok: true,
    ...result,
    alertsSent,
    ranAt: new Date().toISOString(),
  });
}
