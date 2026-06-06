"use client";

import { useEffect, useState } from "react";
import { AppIcon } from "@/components/icons/app-icon";
import { PROOF_MODE_OPTIONS } from "@/lib/streaks/constants";
import { getProofModeOptionLabel } from "@/lib/streaks/proof-modes";
import { formatTimeInTimezone } from "@/lib/streaks/timezone";
import { cn } from "@/lib/utils";

export type CheckInHistoryItem = {
  id: string;
  checkInDate: string;
  createdAt: Date;
  proofMode: string;
  photoUrl: string | null;
  caption: string | null;
  textContent: string | null;
  taskId: string | null;
  taskTitle: string | null;
};

type CheckInHistoryProps = {
  checkIns: CheckInHistoryItem[];
  timezone: string;
};

function hasProofDetail(checkIn: CheckInHistoryItem): boolean {
  return (
    checkIn.proofMode !== "none" ||
    !!checkIn.textContent ||
    !!checkIn.caption ||
    !!checkIn.photoUrl ||
    !!checkIn.taskTitle
  );
}

function CheckInProofPanel({
  checkIn,
  onClose,
}: {
  checkIn: CheckInHistoryItem;
  onClose: () => void;
}) {
  const proofLabel = getProofModeOptionLabel(
    checkIn.proofMode as (typeof PROOF_MODE_OPTIONS)[number]["value"],
  );

  return (
    <div
      className="fixed inset-0 z-50 flex items-end justify-center bg-black/70 p-4 sm:items-center"
      role="dialog"
      aria-modal="true"
      aria-labelledby="check-in-proof-title"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-y-auto rounded-2xl border border-border bg-card p-5 shadow-xl"
        onClick={(event) => event.stopPropagation()}
      >
        <div className="mb-4 flex items-start justify-between gap-3">
          <div>
            <h3
              id="check-in-proof-title"
              className="font-heading text-xl uppercase tracking-wider text-foreground"
            >
              {checkIn.checkInDate}
            </h3>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {proofLabel}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            aria-label="Close proof"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground transition-colors hover:text-foreground"
          >
            <AppIcon name="close" className="text-xl" />
          </button>
        </div>

        {checkIn.proofMode === "none" ? (
          <p className="text-sm text-muted-foreground">
            Checked in with one tap — no extra proof recorded.
          </p>
        ) : null}

        {checkIn.proofMode === "task" && checkIn.taskTitle ? (
          <div className="rounded-lg border border-border bg-background p-4">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Completed task
            </p>
            <p className="mt-2 font-bold uppercase tracking-wide text-foreground">
              {checkIn.taskTitle}
            </p>
          </div>
        ) : null}

        {checkIn.textContent ? (
          <div className="space-y-2">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Note
            </p>
            <p className="whitespace-pre-wrap text-sm text-foreground">
              {checkIn.textContent}
            </p>
          </div>
        ) : null}

        {checkIn.photoUrl ? (
          <div className="space-y-3">
            <div className="overflow-hidden rounded-2xl border border-border bg-muted/40">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={checkIn.photoUrl}
                alt="Check-in proof"
                className="max-h-80 w-full object-contain"
              />
            </div>
            {checkIn.caption ? (
              <p className="text-sm text-muted-foreground">{checkIn.caption}</p>
            ) : null}
          </div>
        ) : checkIn.caption ? (
          <p className="text-sm text-muted-foreground">{checkIn.caption}</p>
        ) : null}
      </div>
    </div>
  );
}

export function CheckInHistory({
  checkIns,
  timezone,
}: CheckInHistoryProps) {
  const [selected, setSelected] = useState<CheckInHistoryItem | null>(null);

  useEffect(() => {
    if (!selected) {
      return;
    }

    function onKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setSelected(null);
      }
    }

    document.body.style.overflow = "hidden";
    window.addEventListener("keydown", onKeyDown);

    return () => {
      document.body.style.overflow = "";
      window.removeEventListener("keydown", onKeyDown);
    };
  }, [selected]);

  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
        Recent Check-ins
      </h2>
      {checkIns.length === 0 ? (
        <p className="text-sm text-muted-foreground">No check-ins yet.</p>
      ) : (
        <ul className="space-y-3">
          {checkIns.map((checkIn) => {
            const proofLabel = getProofModeOptionLabel(
              checkIn.proofMode as (typeof PROOF_MODE_OPTIONS)[number]["value"],
            );
            const showPreview =
              checkIn.textContent ||
              checkIn.caption ||
              checkIn.photoUrl ||
              checkIn.taskTitle;

            return (
              <li key={checkIn.id}>
                <button
                  type="button"
                  onClick={() => setSelected(checkIn)}
                  className={cn(
                    "w-full rounded-lg border border-border bg-card px-4 py-3 text-left shadow-sm transition-colors",
                    "hover:border-primary/40 active:scale-[0.99]",
                  )}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <span className="font-bold uppercase tracking-wide text-foreground">
                        {checkIn.checkInDate}
                      </span>
                      <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                        {proofLabel}
                      </p>
                      {showPreview ? (
                        <p className="mt-2 line-clamp-2 text-sm text-muted-foreground">
                          {checkIn.textContent ??
                            checkIn.caption ??
                            checkIn.taskTitle ??
                            (checkIn.photoUrl ? "Photo proof" : null)}
                        </p>
                      ) : null}
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <span className="font-heading text-xl leading-none text-primary">
                        {formatTimeInTimezone(timezone, checkIn.createdAt)}
                      </span>
                      {hasProofDetail(checkIn) ? (
                        <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
                          View
                        </span>
                      ) : null}
                    </div>
                  </div>
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {selected ? (
        <CheckInProofPanel checkIn={selected} onClose={() => setSelected(null)} />
      ) : null}
    </section>
  );
}
