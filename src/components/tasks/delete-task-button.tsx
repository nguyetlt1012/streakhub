"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { deleteTaskAction } from "@/server/actions/tasks";

type DeleteTaskButtonProps = {
  taskId: string;
  taskTitle: string;
};

export function DeleteTaskButton({ taskId, taskTitle }: DeleteTaskButtonProps) {
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
