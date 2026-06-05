import { formatInTimeZone } from "date-fns-tz";
import { addDays, parseISO, format } from "date-fns";

export function getCalendarDateInTimezone(
  timezone: string,
  date: Date = new Date(),
): string {
  return formatInTimeZone(date, timezone, "yyyy-MM-dd");
}

export function getMonthKeyInTimezone(
  timezone: string,
  date: Date = new Date(),
): string {
  return formatInTimeZone(date, timezone, "yyyy-MM");
}

export function formatReminderTimeForDb(time: string): string {
  const parts = time.split(":");
  if (parts.length === 2) {
    return `${time}:00`;
  }
  return time;
}

export function formatReminderTimeForInput(dbTime: string): string {
  return dbTime.slice(0, 5);
}

export function formatTimeInTimezone(timezone: string, date: Date): string {
  return formatInTimeZone(date, timezone, "HH:mm");
}

export function shiftCalendarDate(dateStr: string, days: number): string {
  return format(addDays(parseISO(dateStr), days), "yyyy-MM-dd");
}

export function getYesterdayInTimezone(
  timezone: string,
  date: Date = new Date(),
): string {
  const today = getCalendarDateInTimezone(timezone, date);
  return shiftCalendarDate(today, -1);
}

export function getStreakCreatedDateInTimezone(
  timezone: string,
  createdAt: Date,
): string {
  return getCalendarDateInTimezone(timezone, createdAt);
}

export function isValidTimezone(timezone: string): boolean {
  try {
    Intl.DateTimeFormat(undefined, { timeZone: timezone });
    return true;
  } catch {
    return false;
  }
}
