import { randomBytes } from "crypto";
import { and, eq, gt, isNull } from "drizzle-orm";
import { db } from "@/lib/db";
import { telegramLinkTokens, telegramLinks } from "@/lib/db/schema";
import { getBotUsername } from "@/lib/telegram/bot";

const TOKEN_TTL_MS = 15 * 60 * 1000;

export async function getTelegramLinkForUser(userId: string) {
  const [link] = await db
    .select()
    .from(telegramLinks)
    .where(eq(telegramLinks.userId, userId))
    .limit(1);

  return link ?? null;
}

export async function createTelegramLinkToken(userId: string): Promise<string> {
  const token = randomBytes(24).toString("hex");
  const expiresAt = new Date(Date.now() + TOKEN_TTL_MS);

  await db.insert(telegramLinkTokens).values({
    token,
    userId,
    expiresAt,
  });

  const username = getBotUsername();
  if (!username) {
    throw new Error("TELEGRAM_BOT_USERNAME is not configured.");
  }

  return `https://t.me/${username}?start=${token}`;
}

export async function consumeTelegramLinkToken(
  token: string,
  chatId: string,
): Promise<{ ok: true; userId: string } | { ok: false; reason: string }> {
  const now = new Date();

  const [row] = await db
    .select()
    .from(telegramLinkTokens)
    .where(
      and(
        eq(telegramLinkTokens.token, token),
        isNull(telegramLinkTokens.usedAt),
        gt(telegramLinkTokens.expiresAt, now),
      ),
    )
    .limit(1);

  if (!row) {
    return { ok: false, reason: "invalid_or_expired" };
  }

  await db
    .update(telegramLinkTokens)
    .set({ usedAt: now })
    .where(eq(telegramLinkTokens.token, token));

  await db
    .insert(telegramLinks)
    .values({
      userId: row.userId,
      chatId,
      linkedAt: now,
    })
    .onConflictDoUpdate({
      target: telegramLinks.userId,
      set: { chatId, linkedAt: now },
    });

  return { ok: true, userId: row.userId };
}

export async function unlinkTelegram(userId: string) {
  await db.delete(telegramLinks).where(eq(telegramLinks.userId, userId));
}

export async function getChatIdForUser(userId: string): Promise<string | null> {
  const link = await getTelegramLinkForUser(userId);
  return link?.chatId ?? null;
}
