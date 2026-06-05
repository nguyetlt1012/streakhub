"use client";

import { useMemo } from "react";
import { AppIcon } from "@/components/icons/app-icon";
import { StreakIcon } from "@/components/streaks/streak-icon";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import type { streaks } from "@/lib/db/schema/streaks";
import { cn } from "@/lib/utils";

type StreakRow = typeof streaks.$inferSelect;

export type TaskStreakOption = {
  id: string;
  name: string;
  iconType: "preset" | "upload";
  iconPreset?: string | null;
  avatarUrl?: string | null;
  currentStreak?: number;
};

export function mapTaskStreakOptions(rows: StreakRow[]): TaskStreakOption[] {
  return rows.map((streak) => ({
    id: streak.id,
    name: streak.name,
    iconType: streak.iconType,
    iconPreset: streak.iconPreset,
    avatarUrl: streak.avatarUrl,
    currentStreak: streak.currentStreak,
  }));
}

const NONE_VALUE = "__none__";

type TaskStreakSelectorProps = {
  name?: string;
  value: string;
  onChange: (streakId: string) => void;
  streaks: TaskStreakOption[];
  emptyLabel?: string;
};

export function TaskStreakSelector({
  name = "streakId",
  value,
  onChange,
  streaks,
  emptyLabel = "No streak",
}: TaskStreakSelectorProps) {
  const selected = useMemo(
    () => streaks.find((streak) => streak.id === value) ?? null,
    [streaks, value],
  );

  if (streaks.length === 0) {
    return (
      <>
        <input type="hidden" name={name} value="" />
        <p className="text-xs text-muted-foreground">
          No task-proof streaks yet. Create a protocol with task proof first.
        </p>
      </>
    );
  }

  return (
    <div className="space-y-2">
      <input type="hidden" name={name} value={value} />
      <Select
        value={value || NONE_VALUE}
        onValueChange={(next) =>
          onChange(next === NONE_VALUE ? "" : String(next))
        }
      >
        <SelectTrigger
          className={cn(
            "h-auto w-full rounded-md border-border bg-input px-4 py-3",
            "text-xs font-bold uppercase tracking-widest",
            "focus-visible:border-primary focus-visible:ring-primary/30",
          )}
        >
          <span className="flex min-w-0 flex-1 items-center gap-3 text-left">
            {selected ? (
              <>
                <StreakIcon
                  iconType={selected.iconType}
                  iconPreset={selected.iconPreset}
                  avatarUrl={selected.avatarUrl}
                  size="sm"
                  className="rounded-md border border-border bg-card"
                />
                <span className="truncate text-foreground">{selected.name}</span>
              </>
            ) : (
              <span className="text-muted-foreground">{emptyLabel}</span>
            )}
          </span>
        </SelectTrigger>

        <SelectContent
          align="start"
          sideOffset={6}
          className="max-h-64 w-(--anchor-width) border-border bg-card p-1"
        >
          <SelectItem
            value={NONE_VALUE}
            className="rounded-md py-2.5 pl-3 pr-8 text-xs font-bold uppercase tracking-widest"
          >
            <span className="flex items-center gap-3">
              <span className="flex size-8 shrink-0 items-center justify-center rounded-md border border-dashed border-border bg-secondary text-muted-foreground">
                —
              </span>
              {emptyLabel}
            </span>
          </SelectItem>

          {streaks.map((streak) => (
            <SelectItem
              key={streak.id}
              value={streak.id}
              className="rounded-md py-2.5 pl-3 pr-8"
            >
              <span className="flex min-w-0 items-center gap-3">
                <StreakIcon
                  iconType={streak.iconType}
                  iconPreset={streak.iconPreset}
                  avatarUrl={streak.avatarUrl}
                  size="sm"
                  className="shrink-0 rounded-md border border-border bg-background"
                />
                <span className="min-w-0 flex-1">
                  <span className="block truncate text-xs font-bold uppercase tracking-wide">
                    {streak.name}
                  </span>
                  <span className="block text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {streak.currentStreak ?? 0} day streak
                  </span>
                </span>
              </span>
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
      <p className="text-xs text-muted-foreground">
        Tap to choose a task-proof streak, or leave unlinked.
      </p>
    </div>
  );
}
