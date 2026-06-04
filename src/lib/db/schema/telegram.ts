import { pgTable, text, timestamp } from "drizzle-orm/pg-core";
import { users } from "./auth";

export const telegramLinks = pgTable("telegram_links", {
  userId: text("user_id")
    .primaryKey()
    .references(() => users.id, { onDelete: "cascade" }),
  chatId: text("chat_id").notNull(),
  linkedAt: timestamp("linked_at", { mode: "date" }).notNull().defaultNow(),
});

/** One-time token for /start <token> bot deep link */
export const telegramLinkTokens = pgTable("telegram_link_tokens", {
  token: text("token").primaryKey(),
  userId: text("user_id")
    .notNull()
    .references(() => users.id, { onDelete: "cascade" }),
  expiresAt: timestamp("expires_at", { mode: "date" }).notNull(),
  usedAt: timestamp("used_at", { mode: "date" }),
  createdAt: timestamp("created_at", { mode: "date" }).notNull().defaultNow(),
});
