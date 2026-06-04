import { and, desc, eq, gte, max } from "drizzle-orm";
import { db } from "@/lib/db";
import {
  checkIns,
  streakFreezeDays,
  streakRuns,
  streaks,
} from "@/lib/db/schema";
import type { streaks as streaksTable } from "@/lib/db/schema/streaks";
import {
  getCalendarDateInTimezone,
  getMonthKeyInTimezone,
  getStreakCreatedDateInTimezone,
  shiftCalendarDate,
} from "@/lib/streaks/timezone";

import type { ProcessMissedDaysResult, StreakAlert } from "@/lib/streaks/alerts";

type StreakRow = typeof streaksTable.$inferSelect;

type ProcessMissedOptions = {
  collectAlerts?: boolean;
};

export async function getLastCheckInDate(
  streakId: string,
  sinceDate?: string | null,
): Promise<string | null> {
  const conditions = [eq(checkIns.streakId, streakId)];
  if (sinceDate) {
    conditions.push(gte(checkIns.checkInDate, sinceDate));
  }

  const [row] = await db
    .select({ latest: max(checkIns.checkInDate) })
    .from(checkIns)
    .where(and(...conditions));

  return row?.latest ?? null;
}

export async function hasCheckInOn(
  streakId: string,
  date: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: checkIns.id })
    .from(checkIns)
    .where(
      and(eq(checkIns.streakId, streakId), eq(checkIns.checkInDate, date)),
    )
    .limit(1);

  return !!row;
}

export async function hasFreezeOn(
  streakId: string,
  date: string,
): Promise<boolean> {
  const [row] = await db
    .select({ id: streakFreezeDays.id })
    .from(streakFreezeDays)
    .where(
      and(
        eq(streakFreezeDays.streakId, streakId),
        eq(streakFreezeDays.frozenOn, date),
      ),
    )
    .limit(1);

  return !!row;
}

/** Reset freeze quota when the calendar month changes in the streak timezone. */
export function getFreezeMonthState(streak: StreakRow): {
  freezesUsedThisMonth: number;
  freezeMonthKey: string;
} {
  const monthKey = getMonthKeyInTimezone(streak.timezone);
  if (streak.freezeMonthKey === monthKey) {
    return {
      freezesUsedThisMonth: streak.freezesUsedThisMonth,
      freezeMonthKey: streak.freezeMonthKey ?? monthKey,
    };
  }
  return { freezesUsedThisMonth: 0, freezeMonthKey: monthKey };
}

export async function computeNextStreakCount(
  streak: StreakRow,
  today: string,
): Promise<number> {
  const runStart = streak.currentRunStartedOn ?? today;
  const lastCheckIn = await getLastCheckInDate(streak.id, runStart);
  const yesterday = shiftCalendarDate(today, -1);
  const dayBeforeYesterday = shiftCalendarDate(today, -2);

  if (!lastCheckIn) {
    return streak.currentStreak + 1;
  }

  if (lastCheckIn === yesterday) {
    return streak.currentStreak + 1;
  }

  if (
    lastCheckIn === dayBeforeYesterday &&
    (await hasFreezeOn(streak.id, yesterday))
  ) {
    return streak.currentStreak + 1;
  }

  return streak.currentStreak + 1;
}

export async function applyCheckInStreakUpdate(
  streakId: string,
  today: string,
): Promise<{ currentStreak: number; bestStreak: number }> {
  const [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.id, streakId))
    .limit(1);

  if (!streak) {
    throw new Error("Streak not found.");
  }

  const nextCurrent = await computeNextStreakCount(streak, today);
  const nextBest = Math.max(streak.bestStreak, nextCurrent);

  await db
    .update(streaks)
    .set({
      currentStreak: nextCurrent,
      bestStreak: nextBest,
      updatedAt: new Date(),
    })
    .where(eq(streaks.id, streakId));

  return { currentStreak: nextCurrent, bestStreak: nextBest };
}

type ProofMode = "task" | "photo" | "text" | "none";

export async function performStreakCheckIn(params: {
  userId: string;
  streakId: string;
  proofMode: ProofMode;
  taskId?: string;
  photoUrl?: string | null;
  caption?: string | null;
  textContent?: string | null;
  /** When true, skip check-in creation if already checked in today (no error). */
  skipIfAlreadyCheckedIn?: boolean;
}): Promise<{ checkedIn: boolean; error?: string }> {
  const [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.id, params.streakId))
    .limit(1);

  if (!streak || streak.userId !== params.userId) {
    return { checkedIn: false, error: "Streak not found." };
  }

  await processMissedDaysForStreak(streak);

  const [refreshed] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.id, params.streakId))
    .limit(1);

  if (!refreshed) {
    return { checkedIn: false, error: "Streak not found." };
  }

  const today = getCalendarDateInTimezone(refreshed.timezone);

  if (await hasCheckInOn(params.streakId, today)) {
    if (params.skipIfAlreadyCheckedIn) {
      return { checkedIn: false };
    }
    return { checkedIn: false, error: "Already checked in today." };
  }

  await db.insert(checkIns).values({
    streakId: params.streakId,
    userId: params.userId,
    checkInDate: today,
    proofMode: params.proofMode,
    taskId: params.taskId ?? null,
    photoUrl: params.photoUrl ?? null,
    caption: params.caption ?? null,
    textContent: params.textContent ?? null,
  });

  await applyCheckInStreakUpdate(params.streakId, today);

  return { checkedIn: true };
}

export async function applyFreezeForDay(
  streak: StreakRow,
  missedDate: string,
): Promise<void> {
  const monthReset = getFreezeMonthState(streak);

  await db.insert(streakFreezeDays).values({
    streakId: streak.id,
    frozenOn: missedDate,
  });

  await db
    .update(streaks)
    .set({
      freezesUsedThisMonth: monthReset.freezesUsedThisMonth + 1,
      freezeMonthKey: monthReset.freezeMonthKey,
      updatedAt: new Date(),
    })
    .where(eq(streaks.id, streak.id));
}

export async function resetStreakAfterMiss(
  streak: StreakRow,
  missedDate: string,
  today: string,
): Promise<void> {
  const runStart = streak.currentRunStartedOn ?? missedDate;
  const finalStreak = streak.currentStreak;
  const nextBest = Math.max(streak.bestStreak, finalStreak);
  const monthReset = getFreezeMonthState(streak);

  await db.insert(streakRuns).values({
    streakId: streak.id,
    startedOn: runStart,
    endedOn: missedDate,
    finalStreak,
    endReason: "missed_no_freeze",
  });

  await db
    .update(streaks)
    .set({
      currentStreak: 0,
      bestStreak: nextBest,
      currentRunStartedOn: today,
      freezesUsedThisMonth: monthReset.freezesUsedThisMonth,
      freezeMonthKey: monthReset.freezeMonthKey,
      updatedAt: new Date(),
    })
    .where(eq(streaks.id, streak.id));
}

export async function processMissedDaysForStreak(
  streak: StreakRow,
  options: ProcessMissedOptions = {},
): Promise<ProcessMissedDaysResult> {
  const alerts: StreakAlert[] = [];
  const today = getCalendarDateInTimezone(streak.timezone);
  const yesterday = shiftCalendarDate(today, -1);
  const createdOn = getStreakCreatedDateInTimezone(
    streak.timezone,
    streak.createdAt,
  );

  let freezesApplied = 0;
  let resets = 0;

  let current = streak;
  let monthReset = getFreezeMonthState(current);

  if (
    monthReset.freezeMonthKey !== current.freezeMonthKey ||
    monthReset.freezesUsedThisMonth !== current.freezesUsedThisMonth
  ) {
    await db
      .update(streaks)
      .set({
        freezesUsedThisMonth: monthReset.freezesUsedThisMonth,
        freezeMonthKey: monthReset.freezeMonthKey,
        updatedAt: new Date(),
      })
      .where(eq(streaks.id, current.id));
    current = {
      ...current,
      freezesUsedThisMonth: monthReset.freezesUsedThisMonth,
      freezeMonthKey: monthReset.freezeMonthKey,
    };
  }

  const lastCheckIn = await getLastCheckInDate(
    current.id,
    current.currentRunStartedOn ?? createdOn,
  );
  const runStart = current.currentRunStartedOn ?? createdOn;

  let cursor = lastCheckIn
    ? shiftCalendarDate(lastCheckIn, 1)
    : runStart;

  while (cursor <= yesterday) {
    if (cursor < createdOn || cursor < runStart) {
      cursor = shiftCalendarDate(cursor, 1);
      continue;
    }

    if (await hasCheckInOn(current.id, cursor)) {
      cursor = shiftCalendarDate(cursor, 1);
      continue;
    }

    if (await hasFreezeOn(current.id, cursor)) {
      cursor = shiftCalendarDate(cursor, 1);
      continue;
    }

    const freezesLeft =
      current.freezePerMonth - current.freezesUsedThisMonth;

    if (freezesLeft > 0) {
      await applyFreezeForDay(current, cursor);
      current = {
        ...current,
        freezesUsedThisMonth: current.freezesUsedThisMonth + 1,
      };
      freezesApplied++;
      if (options.collectAlerts) {
        alerts.push({
          type: "freeze_used",
          userId: current.userId,
          streakId: current.id,
          streakName: current.name,
          missedDate: cursor,
          freezesLeft: current.freezePerMonth - current.freezesUsedThisMonth,
          currentStreak: current.currentStreak,
        });
      }
      cursor = shiftCalendarDate(cursor, 1);
      continue;
    }

    const finalStreak = current.currentStreak;
    await resetStreakAfterMiss(current, cursor, today);
    resets++;
    if (options.collectAlerts) {
      alerts.push({
        type: "streak_reset",
        userId: current.userId,
        streakId: current.id,
        streakName: current.name,
        missedDate: cursor,
        finalStreak,
      });
    }
    break;
  }

  return { freezesApplied, resets, alerts };
}

export async function processAllMissedDays(
  options: ProcessMissedOptions = {},
): Promise<{
  streaksProcessed: number;
  freezesApplied: number;
  resets: number;
  alerts: StreakAlert[];
}> {
  const allStreaks = await db.select().from(streaks);
  let freezesApplied = 0;
  let resets = 0;
  const alerts: StreakAlert[] = [];

  for (const streak of allStreaks) {
    const result = await processMissedDaysForStreak(streak, options);
    freezesApplied += result.freezesApplied;
    resets += result.resets;
    alerts.push(...result.alerts);
  }

  return {
    streaksProcessed: allStreaks.length,
    freezesApplied,
    resets,
    alerts,
  };
}

export async function getTodayCheckInsForUser(userId: string) {
  const userStreaks = await db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId));

  const result: Record<string, boolean> = {};

  for (const streak of userStreaks) {
    const today = getCalendarDateInTimezone(streak.timezone);
    result[streak.id] = await hasCheckInOn(streak.id, today);
  }

  return result;
}

export async function getRecentCheckIns(streakId: string, limit = 30) {
  return db
    .select()
    .from(checkIns)
    .where(eq(checkIns.streakId, streakId))
    .orderBy(desc(checkIns.checkInDate))
    .limit(limit);
}
