import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AppIcon } from "@/components/icons/app-icon";
import {
  DailyVolumeChart,
  MilestonesGrid,
  ProgressCalendar,
} from "@/components/progress/progress-charts";
import {
  getLast7DaysVolume,
  getMonthCalendarData,
  getUserBestStreakMilestones,
  getUserCheckInStats,
  getUserTimezone,
} from "@/lib/progress/queries";

export default async function ProgressPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const timezone = await getUserTimezone(session.user.id);
  const now = new Date();

  const [stats, volume, calendar, milestones] = await Promise.all([
    getUserCheckInStats(session.user.id, timezone),
    getLast7DaysVolume(session.user.id, timezone),
    getMonthCalendarData(session.user.id, timezone, now),
    getUserBestStreakMilestones(session.user.id),
  ]);

  return (
    <main className="min-h-screen pb-32 font-sans selection:bg-primary/30">
      <div className="flex items-end justify-between px-5 pb-6 pt-10">
        <div>
          <h1 className="font-heading text-3xl uppercase tracking-wider text-foreground">
            Performance
          </h1>
          <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
            Consistency analysis
          </p>
        </div>
        <button
          type="button"
          className="rounded-md border border-border bg-secondary p-3 text-foreground transition-colors hover:bg-secondary/80 active:scale-95"
          aria-label="Export data (coming soon)"
          title="Export coming soon"
        >
          <AppIcon name="download" className="text-xl" />
        </button>
      </div>

      <div className="mb-8 px-5">
        <div className="grid grid-cols-2 gap-3">
          <div className="rounded-lg border border-border bg-card p-5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Completed
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-4xl text-foreground">
                {stats.totalCompleted}
              </span>
              <span className="text-[10px] font-bold uppercase text-muted-foreground">
                Total
              </span>
            </div>
          </div>
          <div className="rounded-lg border border-border bg-card p-5">
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Success Rate
            </span>
            <div className="mt-2 flex items-baseline gap-1.5">
              <span className="font-heading text-4xl text-primary">
                {stats.successRate}%
              </span>
            </div>
          </div>
        </div>
      </div>

      <ProgressCalendar
        monthLabel={calendar.monthLabel}
        cells={calendar.cells}
      />
      <DailyVolumeChart days={volume} />
      <MilestonesGrid milestones={milestones} />
    </main>
  );
}
