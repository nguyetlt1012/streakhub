import Link from "next/link";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

type AppHeaderProps = {
  title?: string;
};

export function AppHeader({ title }: AppHeaderProps) {
  return (
    <header className="border-b">
      <div className="mx-auto flex w-full max-w-3xl items-center justify-between gap-4 px-6 py-4">
        <div className="flex min-w-0 items-center gap-4">
          <Link href="/dashboard" className="shrink-0 font-semibold tracking-tight">
            StreakHub
          </Link>
          {title ? (
            <span className="truncate text-sm text-muted-foreground">{title}</span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          <Link
            href="/tasks"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Tasks
          </Link>
          <Link
            href="/settings"
            className={cn(buttonVariants({ variant: "ghost", size: "sm" }))}
          >
            Settings
          </Link>
          <Link href="/streaks/new" className={cn(buttonVariants({ size: "sm" }))}>
            New streak
          </Link>
        </div>
      </div>
    </header>
  );
}
