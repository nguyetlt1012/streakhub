"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";
import { deleteTaskAction } from "@/server/actions/tasks";

type DeleteTaskButtonProps = {
  taskId: string;
  taskTitle: string;
  variant?: "icon" | "full";
};

export function DeleteTaskButton({
  taskId,
  taskTitle,
  variant = "icon",
}: DeleteTaskButtonProps) {
  const router = useRouter();
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  function handleDelete() {
    if (!window.confirm(`Delete "${taskTitle}"?`)) {
      return;
    }
    setError(null);
    startTransition(async () => {
      try {
        await deleteTaskAction(taskId);
        router.refresh();
      } catch {
        setError("Failed to delete task.");
      }
    });
  }

  if (variant === "full") {
    return (
      <div>
        <button
          type="button"
          onClick={handleDelete}
          disabled={pending}
          className="w-full rounded-md border border-destructive/30 bg-destructive/10 py-3 text-xs font-bold uppercase tracking-widest text-destructive transition-all active:scale-95 disabled:opacity-60"
        >
          {pending ? "Deleting..." : "Delete task"}
        </button>
        {error ? (
          <p className="mt-2 text-sm text-destructive" role="alert">
            {error}
          </p>
        ) : null}
      </div>
    );
  }

  return (
    <div className="relative shrink-0">
      <button
        type="button"
        onClick={handleDelete}
        disabled={pending}
        aria-label={`Delete ${taskTitle}`}
        className={cn(
          "flex h-11 w-11 items-center justify-center rounded-md border border-destructive/30 bg-destructive/10 text-destructive transition-all active:scale-95 disabled:opacity-60",
        )}
      >
        <AppIcon name="delete" className="text-xl" />
      </button>
      {error ? (
        <p className="absolute right-0 top-full mt-1 max-w-40 text-xs text-destructive" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}
