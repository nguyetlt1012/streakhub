"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { AppIcon } from "@/components/icons/app-icon";
import { ProtocolCheckButton } from "@/components/dashboard/protocol-check-button";
import { TaskCheckInPanel } from "@/components/tasks/task-check-in-panel";
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

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  if (streak.proofMode === "task") {
    return (
      <TaskCheckInPanel
        streakId={streak.id}
        checkedInToday={checkedInToday}
        openTasks={openTasks}
      />
    );
  }

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

  if (streak.proofMode === "none") {
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
            proofMode="none"
            checkedInToday={false}
          />
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
        Check In
      </h2>
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          {streak.proofMode === "text" &&
            `Write at least ${streak.textMinLength} characters`}
          {streak.proofMode === "photo" && "Upload a proof photo"}
        </p>

        <form action={formAction} className="space-y-4">
          <input type="hidden" name="streakId" value={streak.id} />

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

          {streak.proofMode === "text" ? (
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

          {streak.proofMode === "photo" ? (
            <>
              {!photoUploadEnabled ? (
                <p className="text-sm text-muted-foreground">
                  Photo upload is not configured (R2).
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <label
                      htmlFor={`photo-${streak.id}`}
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Photo
                    </label>
                    <input
                      id={`photo-${streak.id}`}
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                      className="w-full rounded-md border border-border bg-input px-3 py-2 text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-1 file:text-xs file:font-bold file:uppercase file:tracking-widest"
                    />
                  </div>
                  <div className="space-y-2">
                    <label
                      htmlFor={`caption-${streak.id}`}
                      className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
                    >
                      Caption (optional)
                    </label>
                    <input
                      id={`caption-${streak.id}`}
                      name="caption"
                      placeholder="Optional caption"
                      className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm outline-none focus:border-primary"
                    />
                  </div>
                </>
              )}
            </>
          ) : null}

          <button
            type="submit"
            disabled={
              pending || (streak.proofMode === "photo" && !photoUploadEnabled)
            }
            className={cn(
              "w-full rounded-md bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all active:scale-95 disabled:opacity-60",
            )}
          >
            {pending ? "Saving..." : "Check in"}
          </button>
        </form>
      </div>
    </section>
  );
}
