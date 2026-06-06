import {
  date,
  integer,
  pgTable,
  text,
  time,
  timestamp,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const userSettings = pgTable("user_settings", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  /** IANA timezone for morning brief and general scheduling */
  timezone: text("timezone").notNull().default("UTC"),
  /** Daily digest of streaks still due today */
  morningBriefTime: time("morning_brief_time").notNull().default("07:00:00"),
  /** Repeat streak reminders every N minutes after reminder time until check-in */
  reminderIntervalMinutes: integer("reminder_interval_minutes")
    .notNull()
    .default(15),
  /** Calendar day (user TZ) when the morning brief was last sent */
  lastMorningBriefSentOn: date("last_morning_brief_sent_on"),
  updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
});
