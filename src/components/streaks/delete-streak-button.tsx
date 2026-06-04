"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
    <div className="space-y-2">
      <Button
        type="button"
        variant="destructive"
        onClick={handleDelete}
        disabled={pending}
      >
        {pending ? "Deleting..." : "Delete streak"}
      </Button>
      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
