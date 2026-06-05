import Link from "next/link";
import { AppIcon } from "@/components/icons/app-icon";
import { StreakIcon } from "@/components/streaks/streak-icon";
import { PROOF_MODE_OPTIONS } from "@/lib/streaks/constants";
import { formatTimeInTimezone } from "@/lib/streaks/timezone";
import { cn } from "@/lib/utils";

type StreakDetailHeaderProps = {
  name: string;
  timezone: string;
  today: string;
  reminderTime: string;
  initialStreak: number;
  editHref: string;
  iconType: "preset" | "upload";
  iconPreset?: string | null;
  avatarUrl?: string | null;
};

export function StreakDetailHeader({
  name,
  timezone,
  today,
  reminderTime,
  initialStreak,
  editHref,
  iconType,
  iconPreset,
  avatarUrl,
}: StreakDetailHeaderProps) {
  return (
    <header className="mb-8">
      <Link
        href="/streaks"
        className="mb-4 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <AppIcon name="left" className="text-sm" />
        Protocol
      </Link>

      <div className="flex items-start gap-4">
        <StreakIcon
          iconType={iconType}
          iconPreset={iconPreset}
          avatarUrl={avatarUrl}
          size="lg"
          className="rounded-md border border-border bg-background"
        />
        <div className="min-w-0 flex-1">
          <div className="flex flex-wrap items-start gap-2">
            <h1 className="font-heading text-2xl uppercase tracking-wider text-foreground">
              {name}
            </h1>
            {initialStreak > 0 ? (
              <span className="rounded border border-border bg-secondary px-2 py-0.5 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                Started at {initialStreak}
              </span>
            ) : null}
          </div>
          <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {timezone} · Today: {today}
          </p>
          <p className="mt-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Reminder at {reminderTime}
          </p>
        </div>
        <Link
          href={editHref}
          className="shrink-0 rounded-md border border-border bg-secondary p-2.5 text-muted-foreground transition-colors hover:text-foreground active:scale-95"
          aria-label={`Edit ${name}`}
        >
          <AppIcon name="edit" className="text-xl" />
        </Link>
      </div>
    </header>
  );
}

type StreakDetailStatsProps = {
  currentStreak: number;
  bestStreak: number;
  freezesLeft: number;
  proofLabel: string;
  freezePerMonth: number;
};

export function StreakDetailStats({
  currentStreak,
  bestStreak,
  freezesLeft,
  proofLabel,
  freezePerMonth,
}: StreakDetailStatsProps) {
  const stats = [
    { label: "Current", value: String(currentStreak), highlight: true },
    { label: "Best", value: String(bestStreak), highlight: false },
    { label: "Freezes left", value: String(freezesLeft), highlight: false },
    { label: "Proof", value: proofLabel, highlight: false, small: true },
  ];

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 gap-3">
        {stats.map((stat) => (
          <div
            key={stat.label}
            className="rounded-lg border border-border bg-card p-4 shadow-sm"
          >
            <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {stat.label}
            </span>
            <p
              className={cn(
                "mt-2 leading-none",
                stat.small
                  ? "text-sm font-bold uppercase tracking-wide text-foreground"
                  : cn(
                      "font-heading text-4xl",
                      stat.highlight ? "text-primary" : "text-foreground",
                    ),
              )}
            >
              {stat.value}
            </p>
          </div>
        ))}
      </div>
      <p className="mt-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
        {freezePerMonth} freeze{freezePerMonth === 1 ? "" : "s"} per month
      </p>
    </div>
  );
}

type CheckInItem = {
  id: string;
  checkInDate: string;
  createdAt: Date;
  proofMode: string;
  textContent: string | null;
  caption: string | null;
};

const PROOF_LABELS = Object.fromEntries(
  PROOF_MODE_OPTIONS.map((option) => [option.value, option.label]),
) as Record<string, string>;

export function StreakCheckInHistory({
  checkIns,
  timezone,
}: {
  checkIns: CheckInItem[];
  timezone: string;
}) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
        Recent Check-ins
      </h2>
      {checkIns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No check-ins yet.</p>
      ) : (
        <ul className="space-y-3">
          {checkIns.map((checkIn) => (
            <li
              key={checkIn.id}
              className="rounded-lg border border-border bg-card px-4 py-3 shadow-sm"
            >
              <div className="flex items-start justify-between gap-3">
                <div>
                  <span className="font-bold uppercase tracking-wide text-foreground">
                    {checkIn.checkInDate}
                  </span>
                  <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {PROOF_LABELS[checkIn.proofMode] ?? checkIn.proofMode}
                  </p>
                </div>
                <span className="font-heading text-xl leading-none text-primary">
                  {formatTimeInTimezone(timezone, checkIn.createdAt)}
                </span>
              </div>
              {checkIn.textContent ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {checkIn.textContent}
                </p>
              ) : null}
              {checkIn.caption ? (
                <p className="mt-2 text-sm text-muted-foreground">
                  {checkIn.caption}
                </p>
              ) : null}
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}

type RunItem = {
  id: string;
  startedOn: string;
  endedOn: string;
  finalStreak: number;
  endReason: string;
};

export function StreakPastRuns({ runs }: { runs: RunItem[] }) {
  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
        Past Runs
      </h2>
      {runs.length === 0 ? (
        <p className="text-sm text-muted-foreground">No archived runs yet.</p>
      ) : (
        <ul className="space-y-3">
          {runs.map((run) => (
            <li
              key={run.id}
              className="flex flex-col gap-1 rounded-lg border border-border bg-card px-4 py-3 shadow-sm sm:flex-row sm:items-center sm:justify-between"
            >
              <span className="text-sm font-medium uppercase tracking-wide">
                {run.startedOn} → {run.endedOn}
              </span>
              <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                {run.finalStreak} days · {run.endReason.replace(/_/g, " ")}
              </span>
            </li>
          ))}
        </ul>
      )}
    </section>
  );
}
