const TELEGRAM_API = "https://api.telegram.org";

export function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

export function isTelegramConfigured(): boolean {
  return !!getBotToken() && !!process.env.TELEGRAM_BOT_USERNAME;
}

export function getBotUsername(): string | null {
  const raw = process.env.TELEGRAM_BOT_USERNAME;
  if (!raw) {
    return null;
  }
  return raw.replace(/^@/, "");
}

/** Webhook URL; appends Vercel deployment-protection bypass when configured. */
export function buildTelegramWebhookUrl(origin: string): string {
  const base = `${origin.replace(/\/$/, "")}/api/telegram/webhook`;
  const bypass = process.env.VERCEL_PROTECTION_BYPASS;
  if (!bypass) {
    return base;
  }
  return `${base}?x-vercel-protection-bypass=${encodeURIComponent(bypass)}`;
}

export async function sendTelegramMessage(
  chatId: string,
  text: string,
): Promise<boolean> {
  const token = getBotToken();
  if (!token) {
    return false;
  }

  const response = await fetch(`${TELEGRAM_API}/bot${token}/sendMessage`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      chat_id: chatId,
      text,
      disable_web_page_preview: true,
    }),
  });

  return response.ok;
}

export async function setTelegramWebhook(webhookUrl: string): Promise<Response> {
  const token = getBotToken();
  if (!token) {
    throw new Error("TELEGRAM_BOT_TOKEN is not configured.");
  }

  const secret = process.env.TELEGRAM_WEBHOOK_SECRET;
  const body: Record<string, string> = { url: webhookUrl };
  if (secret) {
    body.secret_token = secret;
  }

  return fetch(`${TELEGRAM_API}/bot${token}/setWebhook`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}
