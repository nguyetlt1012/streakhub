import Link from "next/link";
import { Badge } from "@/components/ui/badge";
import { StreakIcon } from "@/components/streaks/streak-icon";
import type { streaks } from "@/lib/db/schema/streaks";

type StreakRow = typeof streaks.$inferSelect;

type StreakCardProps = {
  streak: StreakRow;
  checkedInToday?: boolean;
};

export function StreakCard({ streak, checkedInToday = false }: StreakCardProps) {
  const freezesLeft = Math.max(
    0,
    streak.freezePerMonth - streak.freezesUsedThisMonth,
  );

  return (
    <Link
      href={`/streaks/${streak.id}`}
      className="flex items-center gap-4 rounded-xl border bg-card p-4 transition-colors hover:bg-muted/40"
    >
      <StreakIcon
        iconType={streak.iconType}
        iconPreset={streak.iconPreset}
        avatarUrl={streak.avatarUrl}
        size="lg"
      />
      <div className="min-w-0 flex-1 space-y-1">
        <div className="flex flex-wrap items-center gap-2">
          <h2 className="truncate font-medium">{streak.name}</h2>
          {streak.initialStreak > 0 ? (
            <Badge variant="secondary">Started at {streak.initialStreak}</Badge>
          ) : null}
          {checkedInToday ? (
            <Badge>Done today</Badge>
          ) : (
            <Badge variant="outline">Pending</Badge>
          )}
        </div>
        <p className="text-sm text-muted-foreground">
          {streak.currentStreak} day streak · {freezesLeft} freeze
          {freezesLeft === 1 ? "" : "s"} left
        </p>
      </div>
      <div className="text-right">
        <p className="text-2xl font-semibold tabular-nums">{streak.currentStreak}</p>
        <p className="text-xs text-muted-foreground">current</p>
      </div>
    </Link>
  );
}
