"use server";

import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import {
  createTelegramLinkToken,
  getTelegramLinkForUser,
  unlinkTelegram,
} from "@/lib/telegram/link";
import { isTelegramConfigured } from "@/lib/telegram/bot";

export type TelegramActionState = {
  error?: string;
  linkUrl?: string;
};

async function requireUserId() {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  return session.user.id;
}

export async function generateTelegramLinkAction(): Promise<TelegramActionState> {
  try {
    await requireUserId();
  } catch {
    return { error: "You must be signed in." };
  }

  if (!isTelegramConfigured()) {
    return { error: "Telegram bot is not configured on the server." };
  }

  try {
    const userId = await requireUserId();
    const linkUrl = await createTelegramLinkToken(userId);
    return { linkUrl };
  } catch (error) {
    return {
      error: error instanceof Error ? error.message : "Failed to generate link.",
    };
  }
}

export async function unlinkTelegramAction(): Promise<TelegramActionState> {
  let userId: string;
  try {
    userId = await requireUserId();
  } catch {
    return { error: "You must be signed in." };
  }

  await unlinkTelegram(userId);
  revalidatePath("/settings");

  return {};
}

export async function getTelegramSettingsForUser(userId: string) {
  const link = await getTelegramLinkForUser(userId);
  return {
    linked: !!link,
    linkedAt: link?.linkedAt ?? null,
    configured: isTelegramConfigured(),
  };
}
