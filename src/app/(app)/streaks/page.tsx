import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { ProtocolList } from "@/components/protocol/protocol-list";
import { listStreaksForUser } from "@/lib/streaks/queries";
import {
  getRecentCheckIns,
  processMissedDaysForStreak,
} from "@/lib/streaks/streak-engine";
import { getCalendarDateInTimezone, shiftCalendarDate } from "@/lib/streaks/timezone";

async function getWeekDots(streakId: string, timezone: string) {
  const today = getCalendarDateInTimezone(timezone);
  const dates: string[] = [];
  for (let i = 6; i >= 0; i--) {
    dates.push(shiftCalendarDate(today, -i));
  }

  const recent = await getRecentCheckIns(streakId, 14);
  const checkedDates = new Set(recent.map((c) => c.checkInDate));

  return dates.map((date) => checkedDates.has(date));
}

export default async function StreaksListPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  let streakList = await listStreaksForUser(session.user.id);
  for (const streak of streakList) {
    await processMissedDaysForStreak(streak);
  }
  streakList = await listStreaksForUser(session.user.id);

  const streaks = await Promise.all(
    streakList.map(async (streak) => ({
      id: streak.id,
      name: streak.name,
      timezone: streak.timezone,
      reminderTime: String(streak.reminderTime),
      currentStreak: streak.currentStreak,
      weekDots: await getWeekDots(streak.id, streak.timezone),
    })),
  );

  return (
    <main className="min-h-screen pb-32 font-sans selection:bg-primary/30">
      <div className="px-5 pb-6 pt-10">
        <h1 className="font-heading text-3xl uppercase tracking-wider text-foreground">
          Protocol List
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Manage your active commitments
        </p>
      </div>
      <ProtocolList streaks={streaks} />
    </main>
  );
}
