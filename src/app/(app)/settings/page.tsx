import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { TelegramSettings } from "@/components/settings/telegram-settings";
import { Button } from "@/components/ui/button";
import { getTelegramSettingsForUser } from "@/server/actions/telegram";
import { logoutAction } from "@/server/actions/auth";

export default async function SettingsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const telegram = await getTelegramSettingsForUser(session.user.id);

  return (
    <main className="min-h-screen pb-32 px-5 pt-10 font-sans selection:bg-primary/30">
      <div className="mb-8">
        <h1 className="font-heading text-3xl uppercase tracking-wider text-foreground">
          Profile
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Account & notifications
        </p>
      </div>

      <div className="mb-6 rounded-lg border border-border bg-card p-4">
        <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Signed in as
        </p>
        <p className="mt-1 font-medium">{session.user.name ?? session.user.email}</p>
        {session.user.email ? (
          <p className="text-sm text-muted-foreground">{session.user.email}</p>
        ) : null}
      </div>

      <TelegramSettings
        linked={telegram.linked}
        linkedAt={telegram.linkedAt}
        configured={telegram.configured}
      />

      <form action={logoutAction} className="mt-8">
        <Button
          type="submit"
          variant="outline"
          className="w-full uppercase tracking-widest"
        >
          Log out
        </Button>
      </form>
    </main>
  );
}
