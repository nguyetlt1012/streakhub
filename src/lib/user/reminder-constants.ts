export const DEFAULT_MORNING_BRIEF_TIME = "07:00";
export const DEFAULT_REMINDER_INTERVAL_MINUTES = 15;
export const MIN_REMINDER_INTERVAL_MINUTES = 5;
export const MAX_REMINDER_INTERVAL_MINUTES = 120;

export function parseReminderIntervalMinutes(raw: unknown): {
  value: number;
  error?: string;
} {
  const value = Number.parseInt(String(raw ?? ""), 10);
  if (
    Number.isNaN(value) ||
    value < MIN_REMINDER_INTERVAL_MINUTES ||
    value > MAX_REMINDER_INTERVAL_MINUTES
  ) {
    return {
      value: DEFAULT_REMINDER_INTERVAL_MINUTES,
      error: `Reminder interval must be between ${MIN_REMINDER_INTERVAL_MINUTES} and ${MAX_REMINDER_INTERVAL_MINUTES} minutes.`,
    };
  }
  return { value };
}
