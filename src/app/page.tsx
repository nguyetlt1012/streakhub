import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export default async function HomePage() {
  const session = await auth();

  if (session?.user) {
    redirect("/dashboard");
  }

  return (
    <main className="mx-auto flex w-full max-w-3xl flex-1 flex-col items-center justify-center gap-8 p-6 text-center">
      <div className="space-y-3">
        <h1 className="text-3xl font-semibold tracking-tight">StreakHub</h1>
        <p className="max-w-md text-muted-foreground">
          Track daily habits with streaks, proof check-ins, and Telegram
          reminders.
        </p>
      </div>
      <ul className="grid w-full max-w-sm gap-2 text-left text-sm text-muted-foreground">
        <li className="rounded-lg border px-3 py-2">One check-in per day per streak</li>
        <li className="rounded-lg border px-3 py-2">Freezes protect missed days</li>
        <li className="rounded-lg border px-3 py-2">Proof: tap, text, photo, or task</li>
      </ul>
      <div className="flex gap-3">
        <Link href="/login" className={cn(buttonVariants())}>
          Log in
        </Link>
        <Link href="/register" className={cn(buttonVariants({ variant: "outline" }))}>
          Sign up
        </Link>
      </div>
    </main>
  );
}
