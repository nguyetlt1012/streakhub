import { desc, eq } from "drizzle-orm";
import { db } from "@/lib/db";
import { streaks } from "@/lib/db/schema";

export async function getStreakForUser(streakId: string, userId: string) {
  const [streak] = await db
    .select()
    .from(streaks)
    .where(eq(streaks.id, streakId))
    .limit(1);

  if (!streak || streak.userId !== userId) {
    return null;
  }

  return streak;
}

export async function listStreaksForUser(userId: string) {
  return db
    .select()
    .from(streaks)
    .where(eq(streaks.userId, userId))
    .orderBy(desc(streaks.createdAt));
}
