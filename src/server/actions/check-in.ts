"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { getStreakForUser } from "@/lib/streaks/queries";
import {
  performStreakCheckIn,
  processMissedDaysForStreak,
} from "@/lib/streaks/streak-engine";
import {
  getStreakProofModes,
  parseCheckInProofMode,
} from "@/lib/streaks/proof-modes";
import { getCalendarDateInTimezone } from "@/lib/streaks/timezone";
import { isProofUploadConfigured, uploadProofPhoto } from "@/lib/storage/r2";

export type CheckInActionState = {
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

export async function checkInAction(
  _prevState: CheckInActionState,
  formData: FormData,
): Promise<CheckInActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "You must be signed in." };
  }

  const streakId = (formData.get("streakId") as string | null)?.trim() ?? "";
  const streak = await getStreakForUser(streakId, userId);

  if (!streak) {
    return { error: "Streak not found." };
  }

  const allowedProofModes = getStreakProofModes(streak);
  const proofModeParsed = parseCheckInProofMode(formData, allowedProofModes);
  if (proofModeParsed.error || !proofModeParsed.mode) {
    return { error: proofModeParsed.error ?? "Choose how to prove today." };
  }

  const proofMode = proofModeParsed.mode;

  if (proofMode === "task") {
    return { error: "Complete a linked task to check in." };
  }

  let photoUrl: string | null = null;
  let caption: string | null = null;
  let textContent: string | null = null;

  if (proofMode === "text") {
    textContent = (formData.get("textContent") as string | null)?.trim() ?? "";
    if (textContent.length < streak.textMinLength) {
      return {
        error: `Write at least ${streak.textMinLength} characters.`,
      };
    }
  } else if (proofMode === "photo") {
    if (!isProofUploadConfigured()) {
      return { error: "Photo upload is not configured." };
    }
    const photo = formData.get("photo");
    if (!(photo instanceof File) || photo.size === 0) {
      return { error: "Upload a photo." };
    }
    try {
      photoUrl = await uploadProofPhoto(userId, streakId, photo);
    } catch (error) {
      return {
        error: error instanceof Error ? error.message : "Photo upload failed.",
      };
    }
    caption = (formData.get("caption") as string | null)?.trim() || null;
  }

  await processMissedDaysForStreak(streak);

  const result = await performStreakCheckIn({
    userId,
    streakId,
    proofMode,
    photoUrl,
    caption,
    textContent,
  });

  if (result.error) {
    return { error: result.error };
  }

  revalidatePath("/dashboard");
  revalidatePath("/tasks");
  revalidatePath(`/streaks/${streakId}`);
  if (result.milestoneReached) {
    revalidatePath("/progress");
  }

  return { success: true };
}
