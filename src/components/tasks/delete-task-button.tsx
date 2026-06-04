"use client";

import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import { Button } from "@/components/ui/button";
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
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={handleDelete}
        disabled={pending}
      >
        Delete
      </Button>
      {error ? <p className="text-xs text-destructive">{error}</p> : null}
    </div>
  );
}
