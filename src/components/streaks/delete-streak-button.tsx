"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteStreakAction } from "@/server/actions/streaks";

type DeleteStreakButtonProps = {
  streakId: string;
  streakName: string;
};

export function DeleteStreakButton({
  streakId,
  streakName,
}: DeleteStreakButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    const confirmed = window.confirm(
      `Delete "${streakName}"? This cannot be undone.`,
    );
    if (!confirmed) {
      return;
    }

    setError(null);
    startTransition(async () => {
      try {
        await deleteStreakAction(streakId);
        router.refresh();
      } catch {
        setError("Failed to delete streak.");
      }
    });
  }

  return (
    <section className="border-t border-border pt-8">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        className="w-full rounded-md border border-destructive/30 bg-destructive/10 py-3 text-xs font-bold uppercase tracking-widest text-destructive transition-all active:scale-95 disabled:opacity-60"
      >
        {pending ? "Deleting..." : "Delete streak"}
      </button>
      {error ? (
        <p className="mt-2 text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </section>
  );
}
