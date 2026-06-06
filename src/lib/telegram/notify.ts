import type { StreakAlert } from "@/lib/streaks/alerts";
import { sendTelegramMessage } from "@/lib/telegram/bot";
import { getChatIdForUser } from "@/lib/telegram/link";

function formatFreezeAlert(alert: Extract<StreakAlert, { type: "freeze_used" }>) {
  return (
    `❄️ StreakHub: "${alert.streakName}" — missed ${alert.missedDate}, ` +
    `1 freeze used. ${alert.freezesLeft} freeze(s) left this month. ` +
    `Streak preserved at ${alert.currentStreak} day(s). Check in on the web today.`
  );
}

function formatResetAlert(alert: Extract<StreakAlert, { type: "streak_reset" }>) {
  return (
    `💔 StreakHub: "${alert.streakName}" — streak reset after missing ${alert.missedDate}. ` +
    `Previous run: ${alert.finalStreak} day(s). Check in on the web to start again.`
  );
}

export async function sendStreakAlerts(alerts: StreakAlert[]): Promise<number> {
  let sent = 0;

  for (const alert of alerts) {
    const chatId = await getChatIdForUser(alert.userId);
    if (!chatId) {
      continue;
    }

    const text =
      alert.type === "freeze_used"
        ? formatFreezeAlert(alert)
        : formatResetAlert(alert);

    const ok = await sendTelegramMessage(chatId, text);
    if (ok) {
      sent++;
    }
  }

  return sent;
}

export async function sendMorningBrief(params: {
  chatId: string;
  streakNames: string[];
  appUrl: string;
}): Promise<boolean> {
  const lines = params.streakNames.map((name) => `• ${name}`).join("\n");
  return sendTelegramMessage(
    params.chatId,
    `☀️ StreakHub — Today's protocols\n\n${lines}\n\n` +
      `Open ${params.appUrl} to check in.`,
  );
}

export async function sendDailyReminder(params: {
  chatId: string;
  streakName: string;
  appUrl: string;
}): Promise<boolean> {
  return sendTelegramMessage(
    params.chatId,
    `⏰ StreakHub: Time to check in for "${params.streakName}"! ` +
      `Open ${params.appUrl} to complete today's proof.`,
  );
}
