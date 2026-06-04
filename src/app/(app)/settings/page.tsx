import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TelegramSettings } from "@/components/settings/telegram-settings";
import { getTelegramSettingsForUser } from "@/server/actions/telegram";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const telegram = await getTelegramSettingsForUser(session.user.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div>
        <h1 className="text-2xl font-semibold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Connect Telegram for reminders and alerts.
        </p>
      </div>

      <TelegramSettings
        linked={telegram.linked}
        linkedAt={telegram.linkedAt}
        configured={telegram.configured}
      />
    </main>
  );
}
