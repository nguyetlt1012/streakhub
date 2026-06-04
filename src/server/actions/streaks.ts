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
  PROOF_MODE_OPTIONS,
  type ProofMode,
} from "@/lib/streaks/constants";
import { getStreakForUser } from "@/lib/streaks/queries";
import {
  formatReminderTimeForDb,
  getCalendarDateInTimezone,
  getMonthKeyInTimezone,
  isValidTimezone,
} from "@/lib/streaks/timezone";
import { uploadStreakAvatar } from "@/lib/storage/r2";

export type StreakActionState = {
  error?: string;
};

const PROOF_MODES = new Set<string>(PROOF_MODE_OPTIONS.map((o) => o.value));

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

function parseProofMode(value: FormDataEntryValue | null): ProofMode | null {
  if (typeof value !== "string" || !PROOF_MODES.has(value)) {
    return null;
  }
  return value as ProofMode;
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
  const proofMode = parseProofMode(formData.get("proofMode"));
  const freezePerMonthRaw = formData.get("freezePerMonth");
  const initialStreakRaw = formData.get("initialStreak");
  const avatarFile = formData.get("avatar");

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

  if (!proofMode) {
    return { error: "Select a proof mode." };
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
      proofMode,
      textMinLength: DEFAULT_TEXT_MIN_LENGTH,
      initialStreak,
      currentStreak: initialStreak,
      bestStreak: initialStreak,
      freezesUsedThisMonth: 0,
      freezeMonthKey,
      currentRunStartedOn: today,
    })
    .returning({ id: streaks.id });

  revalidatePath("/dashboard");
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
  const proofMode = parseProofMode(formData.get("proofMode"));
  const freezePerMonthRaw = formData.get("freezePerMonth");
  const avatarFile = formData.get("avatar");
  const removeAvatar = formData.get("removeAvatar") === "true";

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

  if (!proofMode) {
    return { error: "Select a proof mode." };
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
      proofMode,
      updatedAt: new Date(),
    })
    .where(eq(streaks.id, streakId));

  revalidatePath("/dashboard");
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
