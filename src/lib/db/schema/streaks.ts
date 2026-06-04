import {
  boolean,
  date,
  index,
  integer,
  pgEnum,
  pgTable,
  text,
  time,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { users } from "./auth";

export const proofModeEnum = pgEnum("proof_mode", [
  "task",
  "photo",
  "text",
  "none",
]);

export const iconTypeEnum = pgEnum("icon_type", ["preset", "upload"]);

export const streakRunEndReasonEnum = pgEnum("streak_run_end_reason", [
  "missed_no_freeze",
  "manual",
]);

export const streaks = pgTable(
  "streaks",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    userId: text("user_id")
      .notNull()
      .references(() => users.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    /** IANA timezone, e.g. Asia/Ho_Chi_Minh */
    timezone: text("timezone").notNull(),
    reminderTime: time("reminder_time").notNull(),
    iconType: iconTypeEnum("icon_type").notNull().default("preset"),
    /** Lucide icon name when icon_type = preset */
    iconPreset: text("icon_preset"),
    avatarUrl: text("avatar_url"),
    freezePerMonth: integer("freeze_per_month").notNull().default(0),
    proofMode: proofModeEnum("proof_mode").notNull().default("none"),
    textMinLength: integer("text_min_length").notNull().default(15),
    /** Set once at creation; does not backfill check-ins */
    initialStreak: integer("initial_streak").notNull().default(0),
    currentStreak: integer("current_streak").notNull().default(0),
    bestStreak: integer("best_streak").notNull().default(0),
    freezesUsedThisMonth: integer("freezes_used_this_month")
      .notNull()
      .default(0),
    /** YYYY-MM in streak timezone; reset freezes_used when month changes */
    freezeMonthKey: text("freeze_month_key"),
    /** Calendar day (streak TZ) when the active run started */
    currentRunStartedOn: date("current_run_started_on"),
    /** Last calendar day a Telegram reminder was sent (streak TZ) */
    lastReminderSentOn: date("last_reminder_sent_on"),
    /** Future-only sync fields (no V1 UI) */
    externalSource: text("external_source"),
    externalId: text("external_id"),
    lastSyncedAt: timestamp("last_synced_at", { mode: "date" }),
    syncEnabled: boolean("sync_enabled"),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("streaks_user_id_idx").on(table.userId)],
);

export const streakRuns = pgTable(
  "streak_runs",
  {
    id: uuid("id").defaultRandom().primaryKey(),
    streakId: uuid("streak_id")
      .notNull()
      .references(() => streaks.id, { onDelete: "cascade" }),
    startedOn: date("started_on").notNull(),
    endedOn: date("ended_on").notNull(),
    finalStreak: integer("final_streak").notNull(),
    endReason: streakRunEndReasonEnum("end_reason").notNull(),
    createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
  },
  (table) => [index("streak_runs_streak_id_idx").on(table.streakId)],
);

