import Link from "next/link";
import { notFound } from "next/navigation";
import { auth } from "@/auth";
import { CheckInForm } from "@/components/streaks/check-in-form";
import { DeleteStreakButton } from "@/components/streaks/delete-streak-button";
import { StreakIcon } from "@/components/streaks/streak-icon";
import { Badge } from "@/components/ui/badge";
import { buttonVariants } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";
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
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-start gap-4">
        <StreakIcon
          iconType={streak.iconType}
          iconPreset={streak.iconPreset}
          avatarUrl={streak.avatarUrl}
          size="lg"
        />
        <div className="min-w-0 flex-1 space-y-2">
          <div className="flex flex-wrap items-center gap-2">
            <h1 className="text-2xl font-semibold">{streak.name}</h1>
            {streak.initialStreak > 0 ? (
              <Badge variant="secondary">
                Started at {streak.initialStreak}
              </Badge>
            ) : null}
          </div>
          <p className="text-sm text-muted-foreground">
            {streak.timezone} · Today: {today}
          </p>
        </div>
        <Link
          href={`/streaks/${streak.id}/edit`}
          className={cn(buttonVariants({ variant: "outline", size: "sm" }))}
        >
          Edit
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-4 sm:grid-cols-4">
        <Stat label="Current" value={String(streak.currentStreak)} />
        <Stat label="Best" value={String(streak.bestStreak)} />
        <Stat label="Freezes left" value={String(freezesLeft)} />
        <Stat label="Proof" value={proofLabel} />
      </div>

      <p className="text-sm text-muted-foreground">
        Reminder at {formatReminderTimeForInput(String(streak.reminderTime))} ·{" "}
        {streak.freezePerMonth} freeze
        {streak.freezePerMonth === 1 ? "" : "s"}/month
      </p>

      <CheckInForm
        streak={streak}
        checkedInToday={checkedInToday}
        photoUploadEnabled={isProofUploadConfigured()}
        openTasks={openTasks}
      />

      <Separator />

      <section className="space-y-3">
        <h2 className="font-medium">Recent check-ins</h2>
        {recentCheckIns.length === 0 ? (
          <p className="text-sm text-muted-foreground">No check-ins yet.</p>
        ) : (
          <ul className="space-y-2">
            {recentCheckIns.map((checkIn) => (
              <li
                key={checkIn.id}
                className="rounded-lg border px-3 py-2 text-sm"
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-medium">{checkIn.checkInDate}</span>
                  <span className="text-muted-foreground capitalize">
                    {checkIn.proofMode}
                  </span>
                </div>
                {checkIn.textContent ? (
                  <p className="mt-1 text-muted-foreground">{checkIn.textContent}</p>
                ) : null}
                {checkIn.caption ? (
                  <p className="mt-1 text-muted-foreground">{checkIn.caption}</p>
                ) : null}
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      <section className="space-y-3">
        <h2 className="font-medium">Past runs</h2>
        {runs.length === 0 ? (
          <p className="text-sm text-muted-foreground">No archived runs yet.</p>
        ) : (
          <ul className="space-y-2">
            {runs.map((run) => (
              <li
                key={run.id}
                className="flex items-center justify-between rounded-lg border px-3 py-2 text-sm"
              >
                <span>
                  {run.startedOn} → {run.endedOn}
                </span>
                <span className="text-muted-foreground">
                  {run.finalStreak} days · {run.endReason.replace(/_/g, " ")}
                </span>
              </li>
            ))}
          </ul>
        )}
      </section>

      <Separator />

      <DeleteStreakButton streakId={streak.id} streakName={streak.name} />
    </main>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-xl border p-3">
      <p className="text-xs text-muted-foreground">{label}</p>
      <p className="text-lg font-semibold">{value}</p>
    </div>
  );
}
