import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CheckInForm } from "@/components/streaks/check-in-form";
import { DeleteStreakButton } from "@/components/streaks/delete-streak-button";
import {
  StreakCheckInHistory,
  StreakDetailHeader,
  StreakDetailStats,
  StreakPastRuns,
} from "@/components/streaks/streak-detail-sections";
import { PROOF_MODE_OPTIONS } from "@/lib/streaks/constants";
import { getStreakForUser } from "@/lib/streaks/queries";
import {
  getRecentCheckIns,
  hasCheckInOn,
  processMissedDaysForStreak,
} from "@/lib/streaks/streak-engine";
import { listOpenTasksForStreak } from "@/lib/tasks/queries";
import {
  formatReminderTimeForInput,
  getCalendarDateInTimezone,
} from "@/lib/streaks/timezone";
import { isProofUploadConfigured } from "@/lib/storage/r2";
import { db } from "@/lib/db";
import { streakRuns } from "@/lib/db/schema";
import { desc, eq } from "drizzle-orm";

type StreakDetailPageProps = {
  params: Promise<{ id: string }>;
};

export default async function StreakDetailPage({ params }: StreakDetailPageProps) {
  const session = await auth();
  if (!session?.user?.id) {
    notFound();
  }

  const { id } = await params;
  let streak = await getStreakForUser(id, session.user.id);

  if (!streak) {
    notFound();
  }

  await processMissedDaysForStreak(streak);
  streak = (await getStreakForUser(id, session.user.id))!;

  const today = getCalendarDateInTimezone(streak.timezone);
  const checkedInToday = await hasCheckInOn(streak.id, today);
  const openTasks =
    streak.proofMode === "task"
      ? await listOpenTasksForStreak(streak.id, session.user.id)
      : [];
  const recentCheckIns = await getRecentCheckIns(streak.id);

  const runs = await db
    .select()
    .from(streakRuns)
    .where(eq(streakRuns.streakId, id))
    .orderBy(desc(streakRuns.endedOn));

  const proofLabel =
    PROOF_MODE_OPTIONS.find((o) => o.value === streak.proofMode)?.label ??
    streak.proofMode;

  const freezesLeft = Math.max(
    0,
    streak.freezePerMonth - streak.freezesUsedThisMonth,
  );

  return (
    <main className="min-h-screen pb-32 pt-10 font-sans selection:bg-primary/30">
      <div className="px-5">
        <StreakDetailHeader
          name={streak.name}
          timezone={streak.timezone}
          today={today}
          reminderTime={formatReminderTimeForInput(String(streak.reminderTime))}
          initialStreak={streak.initialStreak}
          editHref={`/streaks/${streak.id}/edit`}
          iconType={streak.iconType}
          iconPreset={streak.iconPreset}
          avatarUrl={streak.avatarUrl}
        />

        <StreakDetailStats
          currentStreak={streak.currentStreak}
          bestStreak={streak.bestStreak}
          freezesLeft={freezesLeft}
          proofLabel={proofLabel}
          freezePerMonth={streak.freezePerMonth}
        />

        <CheckInForm
          streak={streak}
          checkedInToday={checkedInToday}
          photoUploadEnabled={isProofUploadConfigured()}
          openTasks={openTasks}
        />

        <StreakCheckInHistory
          checkIns={recentCheckIns}
          timezone={streak.timezone}
        />
        <StreakPastRuns runs={runs} />
        <DeleteStreakButton streakId={streak.id} streakName={streak.name} />
      </div>
    </main>
  );
}
