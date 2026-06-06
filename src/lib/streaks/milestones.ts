import { and, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { streakMilestones, streaks } from "@/lib/db/schema";
import type { streaks as streaksTable } from "@/lib/db/schema/streaks";
import { getCalendarDateInTimezone } from "@/lib/streaks/timezone";

type StreakRow = typeof streaksTable.$inferSelect;

export function validateTargetStreak(
  raw: FormDataEntryValue | null | undefined,
): { value: number | null; error?: string } {
  if (raw === null || raw === undefined) {
    return { value: null };
  }

  const trimmed = String(raw).trim();
  if (trimmed === "") {
    return { value: null };
  }

  const value = Number.parseInt(trimmed, 10);
  if (Number.isNaN(value) || value < 1) {
    return { value: null, error: "Target streak must be at least 1 day." };
  }

  return { value };
}

async function hasMilestoneForTarget(
  streakId: string,
  targetDays: number,
): Promise<boolean> {
  const [row] = await db
    .select({ id: streakMilestones.id })
    .from(streakMilestones)
    .where(
      and(
        eq(streakMilestones.streakId, streakId),
        eq(streakMilestones.targetDays, targetDays),
      ),
    )
    .limit(1);

  return !!row;
}

/** Persists a milestone when the streak reaches its configured target. */
export async function recordTargetMilestoneIfReached(params: {
  streak: StreakRow;
  currentStreak: number;
  achievedOn?: string;
}): Promise<boolean> {
  const target = params.streak.targetStreak;
  if (!target || target < 1) {
    return false;
  }

  if (params.currentStreak < target) {
    return false;
  }

  if (await hasMilestoneForTarget(params.streak.id, target)) {
    return false;
  }

  const achievedOn =
    params.achievedOn ?? getCalendarDateInTimezone(params.streak.timezone);

  await db.insert(streakMilestones).values({
    userId: params.streak.userId,
    streakId: params.streak.id,
    targetDays: target,
    achievedOn,
  });

  return true;
}
