"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { getUserTimezone } from "@/lib/progress/queries";
import {
  formatReminderTimeForDb,
  isValidTimezone,
} from "@/lib/streaks/timezone";
import {
  getOrCreateUserSettings,
} from "@/lib/user/settings";
import {
  parseReminderIntervalMinutes,
} from "@/lib/user/reminder-constants";

export type ReminderSettingsActionState = {
  error?: string;
  success?: boolean;
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function getReminderSettingsForUser(userId: string) {
  const fallbackTimezone = await getUserTimezone(userId);
  const settings = await getOrCreateUserSettings(userId, fallbackTimezone);
  return {
    timezone: settings.timezone,
    morningBriefTime: String(settings.morningBriefTime).slice(0, 5),
    reminderIntervalMinutes: settings.reminderIntervalMinutes,
  };
}

export async function updateReminderSettingsAction(
  _prevState: ReminderSettingsActionState,
  formData: FormData,
): Promise<ReminderSettingsActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "You must be signed in." };
  }

  const timezone = (formData.get("timezone") as string | null)?.trim() ?? "";
  const morningBriefTime =
    (formData.get("morningBriefTime") as string | null)?.trim() ?? "";
  const intervalParsed = parseReminderIntervalMinutes(
    formData.get("reminderIntervalMinutes"),
  );

  if (intervalParsed.error) {
    return { error: intervalParsed.error };
  }

  if (!timezone || !isValidTimezone(timezone)) {
    return { error: "Select a valid timezone." };
  }

  if (!morningBriefTime) {
    return { error: "Morning brief time is required." };
  }

  await getOrCreateUserSettings(userId, timezone);

  await db
    .update(userSettings)
    .set({
      timezone,
      morningBriefTime: formatReminderTimeForDb(morningBriefTime),
      reminderIntervalMinutes: intervalParsed.value,
      updatedAt: new Date(),
    })
    .where(eq(userSettings.userId, userId));

  revalidatePath("/settings");

  return { success: true };
}
