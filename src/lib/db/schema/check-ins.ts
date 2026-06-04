import {
  date,
  index,
  pgTable,
  text,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";
import { proofModeEnum, streaks } from "./streaks";
import { tasks } from "./tasks";

export const checkIns = pgTable(
  "check_ins",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    streakId: uuid("streak_id")
      .notNull()
      .references(() => streaks.id, { onDelete: "cascade" }),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    /** Calendar day in the streak's timezone */
    checkInDate: date("check_in_date").notNull(),
    proofMode: proofModeEnum("proof_mode").notNull(),
    photoUrl: text("photo_url"),
    caption: text("caption"),
    textContent: text("text_content"),
    /** Set when check-in came from completing a linked task */
    taskId: uuid("task_id").references(() => tasks.id, { onDelete: "set null" }),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("check_ins_streak_date_unique").on(table.streakId, table.checkInDate),
    index("check_ins_streak_id_idx").on(table.streakId),
    index("check_ins_user_id_idx").on(table.userId),
  ],
);
