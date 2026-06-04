import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { StreakCard } from "@/components/streaks/streak-card";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
import { listStreaksForUser } from "@/lib/streaks/queries";
import { getTodayCheckInsForUser, processMissedDaysForStreak } from "@/lib/streaks/streak-engine";
import { logoutAction } from "@/server/actions/auth";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user) {
    redirect("/login");
  }

  let streakList = await listStreaksForUser(session.user.id);
  for (const streak of streakList) {
    await processMissedDaysForStreak(streak);
  }
  streakList = await listStreaksForUser(session.user.id);
  const todayCheckIns = await getTodayCheckInsForUser(session.user.id);

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col gap-6 p-6">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Today</h1>
          <p className="text-sm text-muted-foreground">
            Hello, {session.user.name ?? session.user.email}
          </p>
        </div>
        <form action={logoutAction}>
          <Button type="submit" variant="outline" size="sm">
            Log out
          </Button>
        </form>
      </div>

      {streakList.length === 0 ? (
        <div className="rounded-xl border border-dashed p-8 text-center">
          <p className="text-muted-foreground">No streaks yet.</p>
          <Link href="/streaks/new" className={cn(buttonVariants(), "mt-4")}>
            Create your first streak
          </Link>
        </div>
      ) : (
        <div className="space-y-3">
          {streakList.map((streak) => (
            <StreakCard
              key={streak.id}
              streak={streak}
              checkedInToday={todayCheckIns[streak.id] ?? false}
            />
          ))}
        </div>
      )}
    </main>
  );
}
