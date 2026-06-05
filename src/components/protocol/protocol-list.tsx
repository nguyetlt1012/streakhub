"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";
import { formatReminderTimeForInput } from "@/lib/streaks/timezone";

type ProtocolStreak = {
  id: string;
  name: string;
  timezone: string;
  reminderTime: string;
  currentStreak: number;
  weekDots: boolean[];
};

type ProtocolListProps = {
  streaks: ProtocolStreak[];
};

type Filter = "active" | "all" | "broken";

export function ProtocolList({ streaks }: ProtocolListProps) {
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState<Filter>("active");

  const filtered = useMemo(() => {
    return streaks.filter((streak) => {
      const matchesQuery = streak.name
        .toLowerCase()
        .includes(query.toLowerCase());
      if (!matchesQuery) {
        return false;
      }
      if (filter === "active") {
        return streak.currentStreak > 0;
      }
      if (filter === "broken") {
        return streak.currentStreak === 0;
      }
      return true;
    });
  }, [streaks, query, filter]);

  return (
    <>
      <div className="mb-6 space-y-4 px-5">
        <div className="relative">
          <AppIcon
            name="search"
            className="absolute left-4 top-1/2 -translate-y-1/2 text-xl text-muted-foreground"
          />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="SEARCH HABITS..."
            className="w-full rounded-md border border-border bg-input py-3 pl-12 pr-4 text-sm font-bold uppercase tracking-widest outline-none transition-colors focus:border-primary"
          />
        </div>
        <div className="flex gap-2 overflow-x-auto">
          {(
            [
              ["active", "Active"],
              ["all", "All"],
              ["broken", "Broken"],
            ] as const
          ).map(([value, label]) => (
            <button
              key={value}
              type="button"
              onClick={() => setFilter(value)}
              className={cn(
                "whitespace-nowrap rounded-md px-6 py-2 text-[10px] font-bold uppercase tracking-widest transition-colors active:scale-95",
                filter === value
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-secondary text-secondary-foreground",
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      <div className="mb-10 space-y-4 px-5">
        {filtered.length === 0 ? (
          <p className="text-sm text-muted-foreground">No protocols found.</p>
        ) : (
          filtered.map((streak) => (
            <ProtocolCard key={streak.id} streak={streak} />
          ))
        )}
      </div>

      <div className="px-5 pb-8">
        <Link
          href="/streaks/new"
          className="group flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed border-border p-8 text-center transition-colors hover:border-primary/50"
        >
          <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-secondary transition-colors group-hover:bg-primary/10">
            <AppIcon
              name="add"
              className="text-3xl text-muted-foreground group-hover:text-primary"
            />
          </div>
          <h4 className="font-heading text-xl uppercase tracking-wider text-foreground">
            Initiate New Protocol
          </h4>
          <p className="mt-2 max-w-[200px] text-xs text-muted-foreground">
            Define the habit, set the stakes, and start the clock.
          </p>
        </Link>
      </div>
    </>
  );
}

function ProtocolCard({ streak }: { streak: ProtocolStreak }) {
  const broken = streak.currentStreak === 0;
  const reminder = formatReminderTimeForInput(String(streak.reminderTime));

  return (
    <div
      className={cn(
        "relative rounded-lg border border-border bg-card p-5 shadow-sm",
        broken && "bg-card/50 opacity-60",
      )}
    >
      <div className="mb-4 flex items-start justify-between">
        <Link href={`/streaks/${streak.id}`} className="min-w-0 flex-1">
          <h4 className="text-lg font-bold uppercase tracking-wide">
            {streak.name}
          </h4>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Every day • {reminder} • {streak.timezone}
          </p>
        </Link>
        <div className="flex gap-2">
          <Link
            href={`/streaks/${streak.id}/edit`}
            className="text-muted-foreground transition-colors hover:text-foreground"
            aria-label={`Edit ${streak.name}`}
          >
            <AppIcon name="edit" className="text-xl" />
          </Link>
        </div>
      </div>
      <div className="flex items-end justify-between">
        <div className="flex flex-col">
          <span className="text-[10px] font-black uppercase tracking-[0.2em] text-muted-foreground">
            {broken ? "Last Streak" : "Current Streak"}
          </span>
          <span
            className={cn(
              "mt-1 font-heading text-5xl leading-none",
              broken ? "text-muted-foreground" : "text-primary",
            )}
          >
            {streak.currentStreak}
          </span>
        </div>
        <div className="flex gap-1">
          {streak.weekDots.map((done, i) => (
            <div
              key={i}
              className={cn(
                "h-1.5 w-6 rounded-full",
                done ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>
      </div>
    </div>
  );
}
