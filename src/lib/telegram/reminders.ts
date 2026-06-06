import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { streaks, userSettings } from "@/lib/db/schema";
import { hasCheckInOn } from "@/lib/streaks/streak-engine";
import {
  formatReminderTimeForInput,
  getCalendarDateInTimezone,
} from "@/lib/streaks/timezone";
import { getOrCreateUserSettings } from "@/lib/user/settings";
import {
  sendDailyReminder,
  sendMorningBrief,
} from "@/lib/telegram/notify";
import { telegramLinks } from "@/lib/db/schema/telegram";

const CRON_WINDOW_MINUTES = 15;

function getNowMinutesInTimezone(timezone: string, date = new Date()): number {
  const parts = new Intl.DateTimeFormat("en-GB", {
    timeZone: timezone,
    hour: "2-digit",
    minute: "2-digit",
    hour12: false,
  }).formatToParts(date);

  const hour = Number(parts.find((p) => p.type === "hour")?.value ?? "0");
  const minute = Number(parts.find((p) => p.type === "minute")?.value ?? "0");
  return hour * 60 + minute;
}

function getTimeMinutes(timeValue: string): number {
  const hhmm = formatReminderTimeForInput(String(timeValue));
  const [h, m] = hhmm.split(":").map(Number);
  return h * 60 + (m ?? 0);
}

function isWithinCronWindow(nowMinutes: number, targetMinutes: number): boolean {
  return (
    nowMinutes >= targetMinutes &&
    nowMinutes < targetMinutes + CRON_WINDOW_MINUTES
  );
}

function shouldSendRepeatReminder(params: {
  now: Date;
  today: string;
  timezone: string;
  reminderMinutes: number;
  nowMinutes: number;
  intervalMinutes: number;
  lastReminderSentAt: Date | null;
}): boolean {
  if (params.nowMinutes < params.reminderMinutes) {
    return false;
  }

  if (!params.lastReminderSentAt) {
    return true;
  }

  const lastSentDay = getCalendarDateInTimezone(
    params.timezone,
    params.lastReminderSentAt,
  );

  if (lastSentDay !== params.today) {
    return true;
  }

  const elapsedMs = params.now.getTime() - params.lastReminderSentAt.getTime();
  return elapsedMs / 60_000 >= params.intervalMinutes;
}

function getAppUrl(): string {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    "http://localhost:3000"
  );
}

export async function processMorningBriefs(): Promise<{
  usersChecked: number;
  briefsSent: number;
}> {
  const appUrl = getAppUrl();
  const links = await db.select().from(telegramLinks);

  let briefsSent = 0;

  for (const link of links) {
    const settings = await getOrCreateUserSettings(link.userId);
    const today = getCalendarDateInTimezone(settings.timezone);
    const nowMinutes = getNowMinutesInTimezone(settings.timezone);
    const briefMinutes = getTimeMinutes(String(settings.morningBriefTime));

    if (!isWithinCronWindow(nowMinutes, briefMinutes)) {
      continue;
    }

    if (settings.lastMorningBriefSentOn === today) {
      continue;
    }

    const userStreaks = await db
      .select()
      .from(streaks)
      .where(eq(streaks.userId, link.userId));

    const pendingNames: string[] = [];
    for (const streak of userStreaks) {
      const streakToday = getCalendarDateInTimezone(streak.timezone);
      if (!(await hasCheckInOn(streak.id, streakToday))) {
        pendingNames.push(streak.name);
      }
    }

    if (pendingNames.length === 0) {
      await db
        .update(userSettings)
        .set({ lastMorningBriefSentOn: today, updatedAt: new Date() })
        .where(eq(userSettings.userId, link.userId));
      continue;
    }

    const sent = await sendMorningBrief({
      chatId: link.chatId,
      streakNames: pendingNames,
      appUrl,
    });

    if (sent) {
      await db
        .update(userSettings)
        .set({ lastMorningBriefSentOn: today, updatedAt: new Date() })
        .where(eq(userSettings.userId, link.userId));
      briefsSent++;
    }
  }

  return { usersChecked: links.length, briefsSent };
}

export async function processStreakReminders(): Promise<{
  streaksChecked: number;
  remindersSent: number;
}> {
  const appUrl = getAppUrl();
  const now = new Date();

  const rows = await db
    .select({
      streak: streaks,
      chatId: telegramLinks.chatId,
      userId: streaks.userId,
    })
    .from(streaks)
    .innerJoin(telegramLinks, eq(streaks.userId, telegramLinks.userId));

  const intervalByUser = new Map<string, number>();

  let remindersSent = 0;

  for (const { streak, chatId, userId } of rows) {
    let intervalMinutes = intervalByUser.get(userId);
    if (intervalMinutes === undefined) {
      const settings = await getOrCreateUserSettings(userId);
      intervalMinutes = settings.reminderIntervalMinutes;
      intervalByUser.set(userId, intervalMinutes);
    }

    const today = getCalendarDateInTimezone(streak.timezone);
    const nowMinutes = getNowMinutesInTimezone(streak.timezone, now);
    const reminderMinutes = getTimeMinutes(String(streak.reminderTime));

    if (await hasCheckInOn(streak.id, today)) {
      continue;
    }

    const shouldSend = shouldSendRepeatReminder({
      now,
      today,
      timezone: streak.timezone,
      reminderMinutes,
      nowMinutes,
      intervalMinutes,
      lastReminderSentAt: streak.lastReminderSentAt,
    });

    if (!shouldSend) {
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
        .set({
          lastReminderSentAt: now,
          lastReminderSentOn: today,
          updatedAt: now,
        })
        .where(eq(streaks.id, streak.id));
      remindersSent++;
    }
  }

  return { streaksChecked: rows.length, remindersSent };
}

export async function processTelegramReminders(): Promise<{
  streaksChecked: number;
  remindersSent: number;
  usersChecked: number;
  briefsSent: number;
}> {
  const [briefResult, reminderResult] = await Promise.all([
    processMorningBriefs(),
    processStreakReminders(),
  ]);

  return {
    usersChecked: briefResult.usersChecked,
    briefsSent: briefResult.briefsSent,
    streaksChecked: reminderResult.streaksChecked,
    remindersSent: reminderResult.remindersSent,
  };
}
