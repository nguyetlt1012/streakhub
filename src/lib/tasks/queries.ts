import { desc, eq, and, sql } from "drizzle-orm";
import { db } from "@/lib/db";
import { streaks, tasks } from "@/lib/db/schema";

export async function getTaskForUser(taskId: string, userId: string) {
  const [task] = await db
    .select()
    .from(tasks)
    .where(eq(tasks.id, taskId))
    .limit(1);

  if (!task || task.userId !== userId) {
    return null;
  }

  return task;
}

export async function listTasksForUser(userId: string) {
  return db
    .select()
    .from(tasks)
    .where(eq(tasks.userId, userId))
    .orderBy(desc(tasks.createdAt));
}

export async function listOpenTasksForStreak(streakId: string, userId: string) {
  return db
    .select()
    .from(tasks)
    .where(
      and(
        eq(tasks.streakId, streakId),
        eq(tasks.userId, userId),
        eq(tasks.completed, false),
      ),
    )
    .orderBy(desc(tasks.createdAt));
}

export async function listTasksForStreak(streakId: string, userId: string) {
  return db
    .select()
    .from(tasks)
    .where(and(eq(tasks.streakId, streakId), eq(tasks.userId, userId)))
    .orderBy(desc(tasks.createdAt));
}

export async function listTaskStreaksForUser(userId: string) {
  return db
    .select()
    .from(streaks)
    .where(
      and(
        eq(streaks.userId, userId),
        sql`'task' = ANY(${streaks.proofModes})`,
      ),
    )
    .orderBy(desc(streaks.createdAt));
}
