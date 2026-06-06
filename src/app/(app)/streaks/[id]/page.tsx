import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CheckInForm } from "@/components/streaks/check-in-form";
import { CheckInHistory } from "@/components/streaks/check-in-history";
import { DeleteStreakButton } from "@/components/streaks/delete-streak-button";
import {
  StreakDetailHeader,
  StreakDetailStats,
  StreakPastRuns,
} from "@/components/streaks/streak-detail-sections";
import { formatProofModesLabel, streakAllowsProof } from "@/lib/streaks/proof-modes";
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
import { streakMilestones, streakRuns } from "@/lib/db/schema";
import { and, desc, eq } from "drizzle-orm";

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
  const openTasks = streakAllowsProof(streak, "task")
    ? await listOpenTasksForStreak(streak.id, session.user.id)
    : [];
  const recentCheckIns = await getRecentCheckIns(streak.id);

  const runs = await db
    .select()
    .from(streakRuns)
    .where(eq(streakRuns.streakId, id))
    .orderBy(desc(streakRuns.endedOn));

  const proofLabel = formatProofModesLabel(streak.proofModes);

  const freezesLeft = Math.max(
    0,
    streak.freezePerMonth - streak.freezesUsedThisMonth,
  );

  let targetReached = false;
  if (streak.targetStreak && streak.targetStreak > 0) {
    const [milestone] = await db
      .select({ id: streakMilestones.id })
      .from(streakMilestones)
      .where(
        and(
          eq(streakMilestones.streakId, streak.id),
          eq(streakMilestones.targetDays, streak.targetStreak),
        ),
      )
      .limit(1);
    targetReached = !!milestone;
  }

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
          targetStreak={streak.targetStreak}
          targetReached={targetReached}
        />

        <CheckInForm
          streak={streak}
          checkedInToday={checkedInToday}
          photoUploadEnabled={isProofUploadConfigured()}
          openTasks={openTasks}
        />

        <CheckInHistory checkIns={recentCheckIns} timezone={streak.timezone} />
        <StreakPastRuns runs={runs} />
        <DeleteStreakButton streakId={streak.id} streakName={streak.name} />
      </div>
    </main>
  );
}
