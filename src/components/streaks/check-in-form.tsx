"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect, useMemo, useState } from "react";
import { PhotoProofPicker } from "@/components/streaks/photo-proof-picker";
import { AppIcon } from "@/components/icons/app-icon";
import { ProtocolCheckButton } from "@/components/dashboard/protocol-check-button";
import { TaskCheckInPanel } from "@/components/tasks/task-check-in-panel";
import type { ProofMode } from "@/lib/streaks/constants";
import {
  getOrderedCheckInProofOptions,
  getProofModeOptionLabel,
  getStreakProofModes,
  isTaskOnlyProof,
} from "@/lib/streaks/proof-modes";
import { cn } from "@/lib/utils";
import type { streaks } from "@/lib/db/schema/streaks";
import type { tasks } from "@/lib/db/schema/tasks";
import {
  checkInAction,
  type CheckInActionState,
} from "@/server/actions/check-in";

type StreakRow = typeof streaks.$inferSelect;
type TaskRow = typeof tasks.$inferSelect;

type CheckInFormProps = {
  streak: StreakRow;
  checkedInToday: boolean;
  photoUploadEnabled: boolean;
  openTasks?: TaskRow[];
};

const initialState: CheckInActionState = {};

export function CheckInForm({
  streak,
  checkedInToday,
  photoUploadEnabled,
  openTasks = [],
}: CheckInFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(checkInAction, initialState);
  const [proofPhoto, setProofPhoto] = useState<File | null>(null);

  const allowedModes = useMemo(() => getStreakProofModes(streak), [streak]);
  const checkInOptions = useMemo(
    () => getOrderedCheckInProofOptions(allowedModes),
    [allowedModes],
  );
  const [selectedMode, setSelectedMode] = useState<ProofMode>(
    () => checkInOptions[0] ?? "none",
  );

  useEffect(() => {
    if (!checkInOptions.includes(selectedMode)) {
      setSelectedMode(checkInOptions[0] ?? "none");
    }
  }, [checkInOptions, selectedMode]);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  if (checkedInToday) {
    return (
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
          Today
        </h2>
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-card p-4 opacity-90 shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Completed Today
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              You checked in for today.
            </p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-primary bg-primary">
            <AppIcon name="check" className="text-3xl text-primary-foreground" />
          </div>
        </div>
      </section>
    );
  }

  if (isTaskOnlyProof(allowedModes)) {
    return (
      <TaskCheckInPanel
        streakId={streak.id}
        checkedInToday={checkedInToday}
        openTasks={openTasks}
      />
    );
  }

  if (checkInOptions.length === 1 && checkInOptions[0] === "none") {
    return (
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
          Check In
        </h2>
        <div className="flex items-center justify-between rounded-lg border border-border bg-card p-4 shadow-sm">
          <div>
            <p className="font-bold uppercase tracking-wide text-foreground">
              Stamp your day
            </p>
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Mark today as done
            </p>
          </div>
          <ProtocolCheckButton
            streakId={streak.id}
            proofModes={allowedModes}
            checkedInToday={false}
          />
        </div>
      </section>
    );
  }

  const showMethodPicker = checkInOptions.length > 1;

  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
        Check In
      </h2>
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        {showMethodPicker ? (
          <div className="mb-4">
            <p className="mb-3 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Choose proof for today
            </p>
            <div className="flex flex-wrap gap-2">
              {checkInOptions.map((mode) => (
                <button
                  key={mode}
                  type="button"
                  onClick={() => setSelectedMode(mode)}
                  className={cn(
                    "rounded-full border px-3 py-1.5 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                    selectedMode === mode
                      ? "border-primary bg-primary text-primary-foreground"
                      : "border-border bg-secondary text-secondary-foreground hover:border-primary/40",
                  )}
                >
                  {getProofModeOptionLabel(mode)}
                </button>
              ))}
            </div>
          </div>
        ) : (
          <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            {selectedMode === "text" &&
              `Write at least ${streak.textMinLength} characters`}
            {selectedMode === "photo" && "Take or choose a proof photo"}
            {selectedMode === "none" && "Mark today as done"}
          </p>
        )}

        {selectedMode === "task" ? (
          <TaskCheckInPanel
            streakId={streak.id}
            checkedInToday={false}
            openTasks={openTasks}
          />
        ) : selectedMode === "none" ? (
          <div className="flex items-center justify-between rounded-lg border border-border bg-background p-4">
            <div>
              <p className="font-bold uppercase tracking-wide text-foreground">
                One tap check-in
              </p>
              <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                No extra proof needed today
              </p>
            </div>
            <ProtocolCheckButton
              streakId={streak.id}
              proofModes={allowedModes}
              checkedInToday={false}
            />
          </div>
        ) : (
          <form action={formAction} className="space-y-4">
            <input type="hidden" name="streakId" value={streak.id} />
            <input type="hidden" name="proofMode" value={selectedMode} />

            {state.error ? (
              <p className="text-sm text-destructive" role="alert">
                {state.error}
              </p>
            ) : null}
            {state.success ? (
              <p className="text-sm font-bold uppercase tracking-widest text-primary">
                Checked in!
              </p>
            ) : null}

            {selectedMode === "text" ? (
              <textarea
                id={`text-${streak.id}`}
                name="textContent"
                minLength={streak.textMinLength}
                placeholder="WHAT DID YOU DO TODAY?"
                required
                rows={4}
                className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm font-medium outline-none transition-colors focus:border-primary"
              />
            ) : null}

            {selectedMode === "photo" ? (
              !photoUploadEnabled ? (
                <p className="text-sm text-muted-foreground">
                  Photo upload is not configured (R2).
                </p>
              ) : (
                <PhotoProofPicker
                  captionId={`caption-${streak.id}`}
                  onFileChange={setProofPhoto}
                />
              )
            ) : null}

            <button
              type="submit"
              disabled={
                pending ||
                (selectedMode === "photo" &&
                  (!photoUploadEnabled || !proofPhoto))
              }
              className={cn(
                "w-full rounded-md bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all active:scale-95 disabled:opacity-60",
              )}
            >
              {pending ? "Saving..." : "Check in"}
            </button>
          </form>
        )}
      </div>
    </section>
  );
}
