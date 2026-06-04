import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { streaks } from "@/lib/db/schema";
import { hasCheckInOn } from "@/lib/streaks/streak-engine";
import {
  getCalendarDateInTimezone,
  formatReminderTimeForInput,
} from "@/lib/streaks/timezone";
import { sendDailyReminder } from "@/lib/telegram/notify";
import { telegramLinks } from "@/lib/db/schema/telegram";

function getNowMinutesInTimezone(timezone: string): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(new Date());

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function getReminderMinutes(reminderTime: string): number {
  const hhmm = formatReminderTimeForInput(String(reminderTime));
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

export async function processTelegramReminders(): Promise<{
  streaksChecked: number;
  remindersSent: number;
}> {
  const appUrl =
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000";

  const rows = await db
    .select({
      streak: streaks,
      chatId: telegramLinks.chatId,
    })
    .from(streaks)
    .innerJoin(telegramLinks, eq(streaks.userId, telegramLinks.userId));

  let remindersSent = 0;

  for (const { streak, chatId } of rows) {
    const today = getCalendarDateInTimezone(streak.timezone);
    const nowMinutes = getNowMinutesInTimezone(streak.timezone);
    const reminderMinutes = getReminderMinutes(String(streak.reminderTime));

    if (nowMinutes < reminderMinutes || nowMinutes >= reminderMinutes + 15) {
      continue;
    }

    if (streak.lastReminderSentOn === today) {
      continue;
    }

    if (await hasCheckInOn(streak.id, today)) {
      continue;
    }

    const sent = await sendDailyReminder({
      chatId,
      streakName: streak.name,
      appUrl,
    });

    if (sent) {
      await db
        .update(streaks)
        .set({ lastReminderSentOn: today, updatedAt: new Date() })
        .where(eq(streaks.id, streak.id));
      remindersSent++;
    }
  }

  return { streaksChecked: rows.length, remindersSent };
}
