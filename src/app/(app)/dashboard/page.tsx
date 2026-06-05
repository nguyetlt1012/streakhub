import { redirect } from "next/navigation";
import Link from "next/link";
import { formatInTimeZone } from "date-fns-tz";
import { auth } from "@/auth";
import { ProtocolRow } from "@/components/dashboard/protocol-row";
import { TodaysTasksSection } from "@/components/dashboard/todays-tasks-section";
import { AppIcon } from "@/components/icons/app-icon";
import { getUserTimezone } from "@/lib/progress/queries";
import { listStreaksForUser } from "@/lib/streaks/queries";
import {
  getTodayCheckInsForUser,
  processMissedDaysForStreak,
} from "@/lib/streaks/streak-engine";
import { getCalendarDateInTimezone } from "@/lib/streaks/timezone";
import {
  listTaskStreaksForUser,
  listTasksForUser,
} from "@/lib/tasks/queries";

function isCompletedToday(
  completedAt: Date | null,
  timezone: string,
): boolean {
  if (!completedAt) {
    return false;
  }
  const today = getCalendarDateInTimezone(timezone);
  const completedDate = getCalendarDateInTimezone(timezone, completedAt);
  return completedDate === today;
}

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let streakList = await listStreaksForUser(session.user.id);
  for (const streak of streakList) {
    await processMissedDaysForStreak(streak);
  }
  streakList = await listStreaksForUser(session.user.id);

  const timezone = await getUserTimezone(session.user.id);
  const [todayCheckIns, taskList, taskStreaks] = await Promise.all([
    getTodayCheckInsForUser(session.user.id),
    listTasksForUser(session.user.id),
    listTaskStreaksForUser(session.user.id),
  ]);

  const doneCount = streakList.filter(
    (s) => todayCheckIns[s.id] ?? false,
  ).length;
  const totalStreaks = streakList.length;
  const longestRun = Math.max(0, ...streakList.map((s) => s.bestStreak));

  const openTasks = taskList.filter((t) => !t.completed);
  const doneTodayTasks = taskList.filter((t) =>
    isCompletedToday(t.completedAt, timezone),
  );
  const streakNames = Object.fromEntries(
    streakList.map((s) => [s.id, s.name]),
  );

  const firstName =
    session.user.name?.split(/\s+/)[0] ??
    session.user.email?.split("@")[0] ??
    "there";
  const dateLabel = formatInTimeZone(
    new Date(),
    timezone,
    "EEEE, MMM d",
  ).toUpperCase();

  return (
    <main className="min-h-screen pb-24 font-sans selection:bg-primary/30">
      <div className="flex items-center justify-between px-5 pb-6 pt-10">
        <div>
          <h2 className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
            {dateLabel}
          </h2>
          <h1 className="mt-1 font-heading text-3xl uppercase tracking-wider text-foreground">
            Ready, {firstName}?
          </h1>
        </div>
        <div className="flex h-14 w-14 items-center justify-center overflow-hidden rounded-md border-2 border-border bg-card text-lg font-bold uppercase text-primary">
          {firstName.charAt(0)}
        </div>
      </div>

      <div className="mb-8 px-5">
        <div className="border-l-2 border-primary py-1 pl-4">
          <p className="text-sm font-medium uppercase tracking-wide text-secondary-foreground">
            &quot;Discipline equals freedom.
          </p>
          <p className="mt-0.5 text-sm font-bold uppercase tracking-wide text-foreground">
            Stamp your day.&quot;
          </p>
        </div>
      </div>

      {totalStreaks > 0 ? (
        <>
          <div className="mb-10 px-5">
            <div className="grid grid-cols-2 gap-4">
              <div className="flex flex-col justify-between rounded-lg border border-border bg-card p-5 shadow-sm">
                <span className="text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Active Streaks
                </span>
                <div className="mt-3 flex items-baseline gap-1.5">
                  <span className="font-heading text-5xl leading-none text-foreground">
                    {totalStreaks}
                  </span>
                  <span className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
                    Habits
                  </span>
                </div>
              </div>
              <div className="relative flex flex-col justify-between overflow-hidden rounded-lg border border-border bg-card p-5 shadow-sm">
                <div className="absolute -bottom-4 -right-4 opacity-5">
                  <AppIcon name="fire" className="text-9xl text-primary" />
                </div>
                <span className="relative z-10 text-xs font-bold uppercase tracking-widest text-muted-foreground">
                  Longest Run
                </span>
                <div className="relative z-10 mt-3 flex items-baseline gap-1.5">
                  <span className="font-heading text-5xl leading-none text-primary">
                    {longestRun}
                  </span>
                  <span className="text-xs font-bold uppercase tracking-wider text-primary/80">
                    Days
                  </span>
                </div>
              </div>
            </div>
          </div>

          <section className="mb-10 px-5">
            <div className="mb-5 flex items-center justify-between">
              <h3 className="font-heading text-2xl uppercase tracking-wider text-foreground">
                Today&apos;s Protocol
              </h3>
              <span className="rounded border border-primary/20 bg-primary/10 px-2.5 py-1 text-xs font-bold text-primary">
                {doneCount}/{totalStreaks} DONE
              </span>
            </div>
            <div className="space-y-4">
              {streakList.map((streak) => (
                <ProtocolRow
                  key={streak.id}
                  streak={streak}
                  checkedInToday={todayCheckIns[streak.id] ?? false}
                />
              ))}
            </div>
          </section>
        </>
      ) : (
        <div className="mb-10 px-5">
          <div className="rounded-xl border border-dashed border-border p-8 text-center">
            <p className="text-muted-foreground">No streaks yet.</p>
            <Link
              href="/streaks/new"
              className="mt-4 inline-block rounded-md bg-primary px-6 py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground active:scale-95"
            >
              Initiate New Protocol
            </Link>
          </div>
        </div>
      )}

      <TodaysTasksSection
        openTasks={openTasks}
        doneTodayTasks={doneTodayTasks}
        taskStreaks={taskStreaks}
        streakNames={streakNames}
      />
    </main>
  );
}
