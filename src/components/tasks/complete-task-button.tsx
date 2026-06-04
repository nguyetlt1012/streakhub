"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import {
  completeTaskAction,
  type TaskActionState,
} from "@/server/actions/tasks";

const initialState: TaskActionState = {};

type CompleteTaskButtonProps = {
  taskId: string;
  label?: string;
};

export function CompleteTaskButton({
  taskId,
  label = "Complete",
}: CompleteTaskButtonProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(
    completeTaskAction,
    initialState,
  );

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="taskId" value={taskId} />
      <Button type="submit" size="sm" disabled={pending}>
        {pending ? "..." : label}
      </Button>
      {state.error ? (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
