import { eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { userSettings } from "@/lib/db/schema";
import { isValidTimezone } from "@/lib/streaks/timezone";

export type UserSettingsRow = typeof userSettings.$inferSelect;

export async function getUserSettings(
  userId: string,
): Promise<UserSettingsRow | null> {
  const [row] = await db
    .select()
    .from(userSettings)
    .where(eq(userSettings.userId, userId))
    .limit(1);

  return row ?? null;
}

export async function getOrCreateUserSettings(
  userId: string,
  fallbackTimezone = "UTC",
): Promise<UserSettingsRow> {
  const existing = await getUserSettings(userId);
  if (existing) {
    return existing;
  }

  const timezone = isValidTimezone(fallbackTimezone)
    ? fallbackTimezone
    : "UTC";

  const [created] = await db
    .insert(userSettings)
    .values({
      userId,
      timezone,
    })
    .returning();

  return created;
}
