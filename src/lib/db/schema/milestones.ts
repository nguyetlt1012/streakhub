import {
  date,
  index,
  integer,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { streaks } from "./streaks";

export const streakMilestones = pgTable(
  "streak_milestones",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    streakId: uuid("streak_id")
      .notNull()
      .references(() => streaks.id, { onDelete: "cascade" }),
    targetDays: integer("target_days").notNull(),
    /** Calendar day in the streak timezone when the target was reached */
    achievedOn: date("achieved_on").notNull(),
    achievedAt: timestamp("achieved_at", { mode: "date" })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("streak_milestones_user_id_idx").on(table.userId),
    index("streak_milestones_streak_id_idx").on(table.streakId),
    uniqueIndex("streak_milestones_streak_target_idx").on(
      table.streakId,
      table.targetDays,
    ),
  ],
);
