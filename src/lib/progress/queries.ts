import { and, count, eq, gte, lte } from "drizzle-orm";
import { subDays, parseISO, format, startOfMonth, endOfMonth, eachDayOfInterval } from "date-fns";
import { formatInTimeZone } from "date-fns-tz";
import { db } from "@/lib/db";
import { checkIns, streaks } from "@/lib/db/schema";
import { getCalendarDateInTimezone } from "@/lib/streaks/timezone";

export async function getUserCheckInStats(userId: string, timezone: string) {
  const [totalRow] = await db
    .select({ total: count() })
    .from(checkIns)
    .where(eq(checkIns.userId, userId));

  const totalCompleted = Number(totalRow?.total ?? 0);

  const today = getCalendarDateInTimezone(timezone);
  const thirtyDaysAgo = format(subDays(parseISO(today), 29), "yyyy-MM-dd");

  const [recentRow] = await db
    .select({ total: count() })
    .from(checkIns)
    .where(
      and(
        eq(checkIns.userId, userId),
        gte(checkIns.checkInDate, thirtyDaysAgo),
        lte(checkIns.checkInDate, today),
      ),
    );

  const recentCheckIns = Number(recentRow?.total ?? 0);
  const userStreaks = await db
    .select({ id: streaks.id })
    .from(streaks)
    .where(eq(streaks.userId, userId));

  const streakCount = userStreaks.length;
  const expectedSlots = Math.max(1, streakCount * 30);
  const successRate = Math.min(
    100,
    Math.round((recentCheckIns / expectedSlots) * 100),
  );

  return { totalCompleted, successRate };
}

export async function getCheckInsByDateRange(
  userId: string,
  from: string,
  to: string,
) {
  const rows = await db
    .select({
      date: checkIns.checkInDate,
      cnt: count(),
    })
    .from(checkIns)
    .where(
      and(
        eq(checkIns.userId, userId),
        gte(checkIns.checkInDate, from),
        lte(checkIns.checkInDate, to),
      ),
    )
    .groupBy(checkIns.checkInDate);

  return new Map(rows.map((row) => [row.date, Number(row.cnt)]));
}

export async function getUserBestStreakMilestones(userId: string) {
  const userStreaks = await db
    .select({ bestStreak: streaks.bestStreak })
    .from(streaks)
    .where(eq(streaks.userId, userId));

  const maxBest = Math.max(0, ...userStreaks.map((s) => s.bestStreak));

  return [
    {
      threshold: 30,
      unlocked: maxBest >= 30,
      label: "Relentless",
      subtitle: "30 DAY RUN",
    },
    {
      threshold: 100,
      unlocked: maxBest >= 100,
      label: "Overlord",
      subtitle: "100 DAY RUN",
    },
  ];
}

export async function getLast7DaysVolume(userId: string, timezone: string) {
  const today = getCalendarDateInTimezone(timezone);
  const from = format(subDays(parseISO(today), 6), "yyyy-MM-dd");
  const counts = await getCheckInsByDateRange(userId, from, today);

  const days: { label: string; date: string; count: number }[] = [];
  for (let i = 6; i >= 0; i--) {
    const date = format(subDays(parseISO(today), i), "yyyy-MM-dd");
    const label = formatInTimeZone(parseISO(date), timezone, "EEE").toUpperCase();
    days.push({ label, date, count: counts.get(date) ?? 0 });
  }

  const maxCount = Math.max(1, ...days.map((d) => d.count));
  return days.map((d) => ({ ...d, heightPct: Math.round((d.count / maxCount) * 100) }));
}

export async function getMonthCalendarData(
  userId: string,
  timezone: string,
  monthDate: Date,
) {
  const monthStart = startOfMonth(monthDate);
  const monthEnd = endOfMonth(monthDate);
  const from = formatInTimeZone(monthStart, timezone, "yyyy-MM-dd");
  const to = formatInTimeZone(monthEnd, timezone, "yyyy-MM-dd");
  const counts = await getCheckInsByDateRange(userId, from, to);

  const monthLabel = formatInTimeZone(monthDate, timezone, "MMMM yyyy").toUpperCase();
  const daysInMonth = eachDayOfInterval({ start: monthStart, end: monthEnd });
  const startWeekday = (monthStart.getDay() + 6) % 7;

  const cells: {
    day: number | null;
    date: string | null;
    count: number;
    isToday: boolean;
  }[] = [];

  for (let i = 0; i < startWeekday; i++) {
    cells.push({ day: null, date: null, count: 0, isToday: false });
  }

  const today = getCalendarDateInTimezone(timezone);

  for (const day of daysInMonth) {
    const date = formatInTimeZone(day, timezone, "yyyy-MM-dd");
    cells.push({
      day: day.getDate(),
      date,
      count: counts.get(date) ?? 0,
      isToday: date === today,
    });
  }

  return { monthLabel, cells };
}

export async function getUserTimezone(userId: string) {
  const [first] = await db
    .select({ timezone: streaks.timezone })
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .limit(1);

  return first?.timezone ?? Intl.DateTimeFormat().resolvedOptions().timeZone;
}
