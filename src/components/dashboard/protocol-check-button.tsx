"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";
import {
  checkInAction,
  type CheckInActionState,
} from "@/server/actions/check-in";

const initialState: CheckInActionState = {};

type ProtocolCheckButtonProps = {
  streakId: string;
  proofMode: "none" | "text" | "photo" | "task";
  checkedInToday: boolean;
};

export function ProtocolCheckButton({
  streakId,
  proofMode,
  checkedInToday,
}: ProtocolCheckButtonProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(checkInAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  if (checkedInToday) {
    return (
      <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-primary bg-primary">
        <AppIcon name="check" className="text-3xl text-primary-foreground" />
      </div>
    );
  }

  if (proofMode !== "none") {
    return (
      <Link
        href={`/streaks/${streakId}`}
        className="group flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-border bg-secondary transition-all active:scale-95 hover:bg-secondary/80"
        aria-label="Open streak to check in"
      >
        <AppIcon
          name="check"
          className="text-3xl text-muted-foreground transition-colors group-active:text-primary"
        />
      </Link>
    );
  }

  return (
    <form action={formAction} className="shrink-0">
      <input type="hidden" name="streakId" value={streakId} />
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "group flex h-16 w-16 items-center justify-center rounded-md border border-border bg-secondary transition-all active:scale-95 hover:bg-secondary/80 disabled:opacity-60",
        )}
        aria-label="Check in for today"
      >
        <AppIcon
          name="check"
          className="text-3xl text-muted-foreground transition-colors group-active:text-primary"
        />
      </button>
      {state.error ? (
        <p className="absolute mt-1 max-w-32 text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
