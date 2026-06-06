"use server";

import { desc, eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { streakRuns, streaks } from "@/lib/db/schema";
import {
  DEFAULT_TEXT_MIN_LENGTH,
  ICON_PRESET_MAP,
  type ProofMode,
} from "@/lib/streaks/constants";
import {
  parseProofModesFromFormData,
} from "@/lib/streaks/proof-modes";
import { getStreakForUser } from "@/lib/streaks/queries";
import {
  formatReminderTimeForDb,
  getCalendarDateInTimezone,
  getMonthKeyInTimezone,
  isValidTimezone,
} from "@/lib/streaks/timezone";
import { recordTargetMilestoneIfReached, validateTargetStreak } from "@/lib/streaks/milestones";
import { uploadStreakAvatar } from "@/lib/storage/r2";

export type StreakActionState = {
  error?: string;
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

function parseIconType(value: FormDataEntryValue | null): "preset" | "upload" | null {
  if (value === "preset" || value === "upload") {
    return value;
  }
  return null;
}

export async function createStreakAction(
  _prevState: StreakActionState,
  formData: FormData,
): Promise<StreakActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "You must be signed in." };
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const timezone = (formData.get("timezone") as string | null)?.trim() ?? "";
  const reminderTime = (formData.get("reminderTime") as string | null)?.trim() ?? "";
  const iconType = parseIconType(formData.get("iconType"));
  const iconPreset = (formData.get("iconPreset") as string | null)?.trim() ?? "";
  const proofModesParsed = parseProofModesFromFormData(formData);
  const freezePerMonthRaw = formData.get("freezePerMonth");
  const initialStreakRaw = formData.get("initialStreak");
  const targetStreakParsed = validateTargetStreak(formData.get("targetStreak"));
  const avatarFile = formData.get("avatar");

  if (targetStreakParsed.error) {
    return { error: targetStreakParsed.error };
  }

  if (!name) {
    return { error: "Name is required." };
  }

  if (!timezone || !isValidTimezone(timezone)) {
    return { error: "Select a valid timezone." };
  }

  if (!reminderTime) {
    return { error: "Reminder time is required." };
  }

  if (!iconType) {
    return { error: "Choose an icon type." };
  }

  if (proofModesParsed.error || !proofModesParsed.modes) {
    return { error: proofModesParsed.error ?? "Select at least one proof option." };
  }

  const freezePerMonth = Math.max(
    0,
    Number.parseInt(String(freezePerMonthRaw ?? "0"), 10) || 0,
  );
  const initialStreak = Math.max(
    0,
    Number.parseInt(String(initialStreakRaw ?? "0"), 10) || 0,
  );

  let avatarUrl: string | null = null;
  let resolvedIconPreset: string | null = null;

  if (iconType === "preset") {
    if (!iconPreset || !ICON_PRESET_MAP[iconPreset]) {
      return { error: "Select an icon preset." };
    }
    resolvedIconPreset = iconPreset;
  } else {
    if (!(avatarFile instanceof File) || avatarFile.size === 0) {
      return { error: "Upload an avatar image." };
    }
    try {
      avatarUrl = await uploadStreakAvatar(userId, avatarFile);
    } catch (error) {
      return {
        error:
          error instanceof Error ? error.message : "Avatar upload failed.",
      };
    }
  }

  const today = getCalendarDateInTimezone(timezone);
  const freezeMonthKey = getMonthKeyInTimezone(timezone);

  const [created] = await db
    .insert(streaks)
    .values({
      userId,
      name,
      timezone,
      reminderTime: formatReminderTimeForDb(reminderTime),
      iconType,
      iconPreset: resolvedIconPreset,
      avatarUrl,
      freezePerMonth,
      proofModes: proofModesParsed.modes,
      textMinLength: DEFAULT_TEXT_MIN_LENGTH,
      initialStreak,
      targetStreak: targetStreakParsed.value,
      currentStreak: initialStreak,
      bestStreak: initialStreak,
      freezesUsedThisMonth: 0,
      freezeMonthKey,
      currentRunStartedOn: today,
    })
    .returning({ id: streaks.id });

  if (targetStreakParsed.value && initialStreak >= targetStreakParsed.value) {
    const [createdStreak] = await db
      .select()
      .from(streaks)
      .where(eq(streaks.id, created.id))
      .limit(1);

    if (createdStreak) {
      await recordTargetMilestoneIfReached({
        streak: createdStreak,
        currentStreak: initialStreak,
      });
    }
  }

  revalidatePath("/dashboard");
  revalidatePath("/progress");
  redirect(`/streaks/${created.id}`);
}

export async function updateStreakAction(
  _prevState: StreakActionState,
  formData: FormData,
): Promise<StreakActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "You must be signed in." };
  }

  const streakId = (formData.get("streakId") as string | null)?.trim() ?? "";
  const existing = await getStreakForUser(streakId, userId);
  if (!existing) {
    return { error: "Streak not found." };
  }

  const name = (formData.get("name") as string | null)?.trim() ?? "";
  const timezone = (formData.get("timezone") as string | null)?.trim() ?? "";
  const reminderTime = (formData.get("reminderTime") as string | null)?.trim() ?? "";
  const iconType = parseIconType(formData.get("iconType"));
  const iconPreset = (formData.get("iconPreset") as string | null)?.trim() ?? "";
  const proofModesParsed = parseProofModesFromFormData(formData);
  const freezePerMonthRaw = formData.get("freezePerMonth");
  const targetStreakParsed = validateTargetStreak(formData.get("targetStreak"));
  const avatarFile = formData.get("avatar");
  const removeAvatar = formData.get("removeAvatar") === "true";

  if (targetStreakParsed.error) {
    return { error: targetStreakParsed.error };
  }

  if (!name) {
    return { error: "Name is required." };
  }

  if (!timezone || !isValidTimezone(timezone)) {
    return { error: "Select a valid timezone." };
  }

  if (!reminderTime) {
    return { error: "Reminder time is required." };
  }

  if (!iconType) {
    return { error: "Choose an icon type." };
  }

  if (proofModesParsed.error || !proofModesParsed.modes) {
    return { error: proofModesParsed.error ?? "Select at least one proof option." };
  }

  const freezePerMonth = Math.max(
    0,
    Number.parseInt(String(freezePerMonthRaw ?? "0"), 10) || 0,
  );

  let avatarUrl = existing.avatarUrl;
  let resolvedIconPreset: string | null = existing.iconPreset;

  if (iconType === "preset") {
    if (!iconPreset || !ICON_PRESET_MAP[iconPreset]) {
      return { error: "Select an icon preset." };
    }
    resolvedIconPreset = iconPreset;
    avatarUrl = null;
  } else {
    resolvedIconPreset = null;
    if (avatarFile instanceof File && avatarFile.size > 0) {
      try {
        avatarUrl = await uploadStreakAvatar(userId, avatarFile);
      } catch (error) {
        return {
          error:
            error instanceof Error ? error.message : "Avatar upload failed.",
        };
      }
    } else if (removeAvatar || !existing.avatarUrl) {
      return { error: "Upload an avatar image." };
    }
  }

  await db
    .update(streaks)
    .set({
      name,
      timezone,
      reminderTime: formatReminderTimeForDb(reminderTime),
      iconType,
      iconPreset: resolvedIconPreset,
      avatarUrl,
      freezePerMonth,
      proofModes: proofModesParsed.modes,
      targetStreak: targetStreakParsed.value,
      updatedAt: new Date(),
    })
    .where(eq(streaks.id, streakId));

  const [updatedStreak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.id, streakId))
    .limit(1);

  if (updatedStreak) {
    await recordTargetMilestoneIfReached({
      streak: updatedStreak,
      currentStreak: updatedStreak.currentStreak,
    });
  }

  revalidatePath("/dashboard");
  revalidatePath("/progress");
  revalidatePath(`/streaks/${streakId}`);
  redirect(`/streaks/${streakId}`);
}

export async function deleteStreakAction(streakId: string) {
  const userId = await requireUserId();
  const existing = await getStreakForUser(streakId, userId);
  if (!existing) {
    throw new Error("Streak not found.");
  }

  await db.delete(streaks).where(eq(streaks.id, streakId));

  revalidatePath("/dashboard");
  redirect("/dashboard");
}

export async function getStreakRunsAction(streakId: string) {
  const userId = await requireUserId();
  const existing = await getStreakForUser(streakId, userId);
  if (!existing) {
    return [];
  }

  return db
    .select()
    .from(streakRuns)
    .where(eq(streakRuns.streakId, streakId))
    .orderBy(desc(streakRuns.endedOn));
}
