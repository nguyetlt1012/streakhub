import { NextResponse } from "next/server";
import { consumeTelegramLinkToken } from "@/lib/telegram/link";
import { sendTelegramMessage } from "@/lib/telegram/bot";

type TelegramUpdate = {
  message?: {
    chat: { id: number };
    text?: string;
  };
};

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== webhookSecret) {
      return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
    }
  }

  let update: TelegramUpdate;
  try {
    update = (await request.json()) as TelegramUpdate;
  } catch {
    return NextResponse.json({ ok: true });
  }

  const message = update.message;
  if (!message?.text || !message.chat?.id) {
    return NextResponse.json({ ok: true });
  }

  const chatId = String(message.chat.id);
  const text = message.text.trim();

  if (text.startsWith("/start")) {
    const token = text.split(/\s+/)[1];

    if (!token) {
      await sendTelegramMessage(
        chatId,
        "Welcome to StreakHub! Generate a link in Settings on the web app, then tap /start with your token.",
      );
      return NextResponse.json({ ok: true });
    }

    const result = await consumeTelegramLinkToken(token, chatId);

    if (result.ok) {
      await sendTelegramMessage(
        chatId,
        "StreakHub linked! You'll get daily reminders and streak alerts here. Check-ins stay on the web app.",
      );
    } else {
      await sendTelegramMessage(
        chatId,
        "Link expired or invalid. Generate a new link in Settings on the web app.",
      );
    }
  }

  return NextResponse.json({ ok: true });
}
