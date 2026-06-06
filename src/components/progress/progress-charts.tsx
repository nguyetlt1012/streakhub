"use client";

import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";

type ProgressCalendarProps = {
  monthLabel: string;
  cells: {
    day: number | null;
    date: string | null;
    count: number;
    isToday: boolean;
  }[];
};

export function ProgressCalendar({ monthLabel, cells }: ProgressCalendarProps) {
  return (
    <section className="mb-10 px-5">
      <div className="mb-4 flex items-center justify-between">
        <h3 className="font-heading text-xl uppercase tracking-wider text-foreground">
          {monthLabel}
        </h3>
        <div className="flex gap-2 text-muted-foreground">
          <AppIcon name="left" className="text-xl" />
          <AppIcon name="right" className="text-xl" />
        </div>
      </div>
      <div className="rounded-xl border border-border bg-card p-5 shadow-sm">
        <div className="mb-4 grid grid-cols-7 gap-2 text-center">
          {["M", "T", "W", "T", "F", "S", "S"].map((d, i) => (
            <span
              key={`${d}-${i}`}
              className="text-[10px] font-bold text-muted-foreground"
            >
              {d}
            </span>
          ))}
        </div>
        <div className="grid grid-cols-7 gap-2">
          {cells.map((cell, index) => {
            if (cell.day === null) {
              return (
                <div
                  key={`empty-${index}`}
                  className="aspect-square"
                  aria-hidden
                />
              );
            }

            const hasCheckIn = cell.count > 0;

            return (
              <div
                key={cell.date ?? index}
                className={cn(
                  "flex aspect-square items-center justify-center rounded-md text-[10px] font-bold",
                  hasCheckIn
                    ? "bg-primary text-foreground shadow-[0_0_15px_-5px_#FF5722]"
                    : cell.isToday
                      ? "border border-primary/40 text-foreground"
                      : "text-muted-foreground/40",
                )}
              >
                {cell.day}
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}

type DailyVolumeProps = {
  days: { label: string; count: number; heightPct: number }[];
};

export function DailyVolumeChart({ days }: DailyVolumeProps) {
  return (
    <section className="mb-10 px-5">
      <h3 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
        Daily Volume
      </h3>
      <div className="flex h-48 items-end justify-between gap-3 rounded-xl border border-border bg-card p-6 pb-10">
        {days.map((day) => (
          <div
            key={day.label}
            className="relative h-full flex-1 rounded-t-sm bg-secondary"
          >
            <div
              className="absolute bottom-0 w-full rounded-t-sm bg-primary transition-all"
              style={{ height: `${Math.max(day.heightPct, day.count > 0 ? 8 : 0)}%` }}
            />
            <span className="absolute -bottom-6 left-1/2 -translate-x-1/2 text-[10px] font-bold text-muted-foreground">
              {day.label}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}

type Milestone = {
  id: string;
  threshold: number;
  unlocked: boolean;
  label: string;
  subtitle: string;
};

export function MilestonesGrid({ milestones }: { milestones: Milestone[] }) {
  return (
    <section className="mb-10 px-5">
      <h3 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
        Milestones
      </h3>
      <div className="grid grid-cols-2 gap-4">
        {milestones.map((milestone) => (
          <div
            key={milestone.id}
            className={cn(
              "flex items-center gap-4 rounded-lg border border-border bg-card p-4",
              !milestone.unlocked && "opacity-40",
            )}
          >
            <div
              className={cn(
                "flex h-16 w-16 shrink-0 items-center justify-center rounded-lg border border-border bg-background",
                milestone.unlocked ? "text-primary" : "text-muted-foreground",
              )}
            >
              {milestone.unlocked ? (
                <AppIcon name="fire" className="text-3xl" />
              ) : (
                <AppIcon name="lock" className="text-2xl" />
              )}
            </div>
            <div>
              <h4 className="text-sm font-bold uppercase tracking-wide">
                {milestone.label}
              </h4>
              <p
                className={cn(
                  "mt-1 text-[10px] font-bold uppercase",
                  milestone.unlocked
                    ? "text-primary"
                    : "text-muted-foreground",
                )}
              >
                {milestone.subtitle}
              </p>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
