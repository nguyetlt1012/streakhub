"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
import { AppIcon } from "@/components/icons/app-icon";
import { cn } from "@/lib/utils";
import {
  completeTaskAction,
  type TaskActionState,
} from "@/server/actions/tasks";

const initialState: TaskActionState = {};

type CompleteTaskButtonProps = {
  taskId: string;
  label?: string;
  variant?: "default" | "stamp";
};

export function CompleteTaskButton({
  taskId,
  label = "Complete",
  variant = "default",
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

  if (variant === "stamp") {
    return (
      <form action={formAction} className="shrink-0">
        <input type="hidden" name="taskId" value={taskId} />
        <button
          type="submit"
          disabled={pending}
          className="group flex h-16 w-16 items-center justify-center rounded-md border border-border bg-secondary transition-all active:scale-95 hover:bg-secondary/80 disabled:opacity-60"
          aria-label={`Complete task`}
        >
          <AppIcon
            name="check"
            className="text-3xl text-muted-foreground transition-colors group-active:text-primary"
          />
        </button>
        {state.error ? (
          <p className="mt-1 max-w-32 text-xs text-destructive">{state.error}</p>
        ) : null}
      </form>
    );
  }

  return (
    <form action={formAction} className="inline">
      <input type="hidden" name="taskId" value={taskId} />
      <button
        type="submit"
        disabled={pending}
        className={cn(
          "rounded-md bg-primary px-3 py-1.5 text-xs font-bold uppercase tracking-widest text-primary-foreground active:scale-95 disabled:opacity-60",
        )}
      >
        {pending ? "..." : label}
      </button>
      {state.error ? (
        <p className="mt-1 text-xs text-destructive">{state.error}</p>
      ) : null}
    </form>
  );
}
