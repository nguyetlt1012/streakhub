"use server";

import { eq } from "drizzle-orm";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { db } from "@/lib/db";
import { tasks } from "@/lib/db/schema";
import { getStreakForUser } from "@/lib/streaks/queries";
import { performStreakCheckIn } from "@/lib/streaks/streak-engine";
import { getTaskForUser } from "@/lib/tasks/queries";

export type TaskActionState = {
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

async function validateStreakLink(
  userId: string,
  streakId: string | null,
): Promise<TaskActionState | null> {
  if (!streakId) {
    return null;
  }

  const streak = await getStreakForUser(streakId, userId);
  if (!streak) {
    return { error: "Streak not found." };
  }

  if (streak.proofMode !== "task") {
    return { error: "Link tasks only to streaks with task proof mode." };
  }

  return null;
}

export async function createTaskAction(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "You must be signed in." };
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description =
    (formData.get("description") as string | null)?.trim() || null;
  const streakIdRaw = (formData.get("streakId") as string | null)?.trim() ?? "";
  const streakId = streakIdRaw || null;

  if (!title) {
    return { error: "Title is required." };
  }

  const linkError = await validateStreakLink(userId, streakId);
  if (linkError) {
    return linkError;
  }

  await db.insert(tasks).values({
    userId,
    title,
    description,
    streakId,
  });

  revalidatePath("/tasks");
  if (streakId) {
    revalidatePath(`/streaks/${streakId}`);
  }
  revalidatePath("/dashboard");

  const redirectTo = (formData.get("redirectTo") as string | null)?.trim();
  if (redirectTo === "dashboard" || redirectTo === "none") {
    return { success: true };
  }

  redirect("/tasks");
}

export async function updateTaskAction(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "You must be signed in." };
  }

  const taskId = (formData.get("taskId") as string | null)?.trim() ?? "";
  const existing = await getTaskForUser(taskId, userId);
  if (!existing) {
    return { error: "Task not found." };
  }

  const title = (formData.get("title") as string | null)?.trim() ?? "";
  const description =
    (formData.get("description") as string | null)?.trim() || null;
  const streakIdRaw = (formData.get("streakId") as string | null)?.trim() ?? "";
  const streakId = streakIdRaw || null;

  if (!title) {
    return { error: "Title is required." };
  }

  const linkError = await validateStreakLink(userId, streakId);
  if (linkError) {
    return linkError;
  }

  await db
    .update(tasks)
    .set({
      title,
      description,
      streakId,
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  revalidatePath("/tasks");
  revalidatePath(`/tasks/${taskId}/edit`);
  if (existing.streakId) {
    revalidatePath(`/streaks/${existing.streakId}`);
  }
  if (streakId) {
    revalidatePath(`/streaks/${streakId}`);
  }

  redirect("/tasks");
}

export async function deleteTaskAction(taskId: string) {
  const userId = await requireUserId();
  const existing = await getTaskForUser(taskId, userId);
  if (!existing) {
    throw new Error("Task not found.");
  }

  await db.delete(tasks).where(eq(tasks.id, taskId));

  revalidatePath("/tasks");
  if (existing.streakId) {
    revalidatePath(`/streaks/${existing.streakId}`);
  }
  revalidatePath("/dashboard");
}

export async function completeTaskAction(
  _prevState: TaskActionState,
  formData: FormData,
): Promise<TaskActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "You must be signed in." };
  }

  const taskId = (formData.get("taskId") as string | null)?.trim() ?? "";
  const task = await getTaskForUser(taskId, userId);

  if (!task) {
    return { error: "Task not found." };
  }

  if (task.completed) {
    return { error: "Task is already completed." };
  }

  await db
    .update(tasks)
    .set({
      completed: true,
      completedAt: new Date(),
      updatedAt: new Date(),
    })
    .where(eq(tasks.id, taskId));

  if (task.streakId) {
    const streak = await getStreakForUser(task.streakId, userId);
    if (streak?.proofMode === "task") {
      const result = await performStreakCheckIn({
        userId,
        streakId: task.streakId,
        proofMode: "task",
        taskId,
        skipIfAlreadyCheckedIn: true,
      });

      if (result.error) {
        return { error: result.error };
      }
    }
  }

  revalidatePath("/tasks");
  revalidatePath("/dashboard");
  if (task.streakId) {
    revalidatePath(`/streaks/${task.streakId}`);
  }

  return { success: true };
}
