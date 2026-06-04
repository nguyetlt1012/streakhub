const TELEGRAM_API = "https://api.telegram.org";

function getBotToken(): string | null {
  return process.env.TELEGRAM_BOT_TOKEN ?? null;
}

export function isTelegramConfigured(): boolean {
  return !!getBotToken() && !!process.env.TELEGRAM_BOT_USERNAME;
}

export function getBotUsername(): string | null {
  return process.env.TELEGRAM_BOT_USERNAME ?? null;
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
