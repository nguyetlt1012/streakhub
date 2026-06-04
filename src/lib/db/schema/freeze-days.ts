import {
  date,
  index,
  pgTable,
  timestamp,
  unique,
  uuid,
} from "drizzle-orm/pg-core";
import { streaks } from "./streaks";

/** Records calendar days covered by an automatic freeze (not a check-in). */
export const streakFreezeDays = pgTable(
  "streak_freeze_days",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    streakId: uuid("streak_id")
      .notNull()
      .references(() => streaks.id, { onDelete: "cascade" }),
    /** Calendar day in the streak's timezone */
    frozenOn: date("frozen_on").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [
    unique("streak_freeze_days_streak_date_unique").on(
      table.streakId,
      table.frozenOn,
    ),
    index("streak_freeze_days_streak_id_idx").on(table.streakId),
  ],
);
