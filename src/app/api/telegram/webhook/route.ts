import { NextResponse } from "next/server";
import { getBotToken, buildTelegramWebhookUrl, sendTelegramMessage, setTelegramWebhook } from "@/lib/telegram/bot";
import { consumeTelegramLinkToken } from "@/lib/telegram/link";

type TelegramUpdate = {
  message?: {
    chat: { id: number };
    text?: string;
  };
};

function getAppOrigin(): string | null {
  return (
    process.env.NEXT_PUBLIC_APP_URL ??
    process.env.AUTH_URL ??
    null
  )?.replace(/\/$/, "") ?? null;
}

/** Register webhook with Telegram (call once after deploy). */
export async function GET(request: Request) {
  const cronSecret = process.env.CRON_SECRET;
  if (!cronSecret) {
    return NextResponse.json({ error: "CRON_SECRET not configured." }, { status: 500 });
  }

  const authHeader = request.headers.get("authorization");
  if (authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized." }, { status: 401 });
  }

  const token = getBotToken();
  if (!token) {
    return NextResponse.json({ error: "TELEGRAM_BOT_TOKEN not configured." }, { status: 500 });
  }

  const origin = getAppOrigin();
  if (!origin) {
    return NextResponse.json(
      { error: "Set NEXT_PUBLIC_APP_URL or AUTH_URL to your production URL." },
      { status: 500 },
    );
  }

  const webhookUrl = buildTelegramWebhookUrl(origin);
  const setRes = await setTelegramWebhook(webhookUrl);
  const setBody = await setRes.json();

  const infoRes = await fetch(
    `https://api.telegram.org/bot${token}/getWebhookInfo`,
  );
  const infoBody = await infoRes.json();

  return NextResponse.json({
    webhookUrl,
    setWebhook: setBody,
    webhookInfo: infoBody,
  });
}

export async function POST(request: Request) {
  const webhookSecret = process.env.TELEGRAM_WEBHOOK_SECRET;
  if (webhookSecret) {
    const header = request.headers.get("x-telegram-bot-api-secret-token");
    if (header !== webhookSecret) {
      console.error("[telegram/webhook] Rejected: secret token mismatch");
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

  if (!text.startsWith("/start")) {
    return NextResponse.json({ ok: true });
  }

  const token = text.split(/\s+/)[1];

  try {
    if (!token) {
      await sendTelegramMessage(
        chatId,
        "Welcome to StreakHub! Open the link from Settings (Generate link), then tap Start — do not type /start alone.",
      );
      return NextResponse.json({ ok: true });
    }

    if (!getBotToken()) {
      console.error("[telegram/webhook] TELEGRAM_BOT_TOKEN missing on server");
      return NextResponse.json({ ok: true });
    }

    const result = await consumeTelegramLinkToken(token, chatId);

    if (result.ok) {
      const sent = await sendTelegramMessage(
        chatId,
        "StreakHub linked! You'll get daily reminders and streak alerts here. Check-ins stay on the web app.",
      );
      if (!sent) {
        console.error("[telegram/webhook] sendMessage failed after link");
      }
    } else {
      await sendTelegramMessage(
        chatId,
        "Link expired or invalid. Generate a new link in Settings on the web app.",
      );
    }
  } catch (error) {
    console.error("[telegram/webhook] Handler error:", error);
    await sendTelegramMessage(
      chatId,
      "Something went wrong linking your account. Try generating a new link in Settings.",
    );
  }

  return NextResponse.json({ ok: true });
}
