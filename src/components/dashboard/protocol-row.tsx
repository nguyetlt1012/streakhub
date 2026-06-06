import Link from "next/link";
import { ProtocolCheckButton } from "@/components/dashboard/protocol-check-button";
import { StreakIcon } from "@/components/streaks/streak-icon";
import { getStreakProofModes } from "@/lib/streaks/proof-modes";
import { cn } from "@/lib/utils";
import type { streaks } from "@/lib/db/schema/streaks";

type StreakRow = typeof streaks.$inferSelect;

type ProtocolRowProps = {
  streak: StreakRow;
  checkedInToday: boolean;
};

export function ProtocolRow({ streak, checkedInToday }: ProtocolRowProps) {
  return (
    <div
      className={cn(
        "flex items-center justify-between rounded-lg border p-4 shadow-sm transition-opacity",
        checkedInToday
          ? "border-primary/30 opacity-60 hover:opacity-100"
          : "border-border bg-card",
      )}
    >
      <Link
        href={`/streaks/${streak.id}`}
        className="flex min-w-0 flex-1 items-center gap-4"
      >
        {checkedInToday ? (
          <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-md border border-primary/20 bg-primary/10">
            <span className="font-heading text-3xl leading-none text-primary">
              {streak.currentStreak}
            </span>
          </div>
        ) : (
          <StreakIcon
            iconType={streak.iconType}
            iconPreset={streak.iconPreset}
            avatarUrl={streak.avatarUrl}
            size="lg"
            className="rounded-md border border-border bg-background"
          />
        )}
        <div className="min-w-0">
          <h4
            className={cn(
              "text-lg font-bold uppercase leading-tight tracking-wide",
              checkedInToday
                ? "text-muted-foreground line-through decoration-muted-foreground/50"
                : "text-foreground",
            )}
          >
            {streak.name}
          </h4>
          {checkedInToday ? (
            <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-widest text-primary">
              Completed Today
            </span>
          ) : (
            <div className="mt-1 flex items-center gap-2">
              <span className="font-heading text-2xl leading-none text-primary">
                {streak.currentStreak}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                Day Streak
              </span>
            </div>
          )}
        </div>
      </Link>
      <ProtocolCheckButton
        streakId={streak.id}
        proofModes={getStreakProofModes(streak)}
        checkedInToday={checkedInToday}
      />
    </div>
  );
}
