"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AppIcon } from "@/components/icons/app-icon";
import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import {
  TaskStreakSelector,
  mapTaskStreakOptions,
} from "@/components/tasks/task-streak-selector";
import type { streaks } from "@/lib/db/schema/streaks";
import type { tasks } from "@/lib/db/schema/tasks";
import {
  updateTaskAction,
  type TaskActionState,
} from "@/server/actions/tasks";

type StreakRow = typeof streaks.$inferSelect;
type TaskRow = typeof tasks.$inferSelect;

const initialState: TaskActionState = {};

type TaskEditFormProps = {
  task: TaskRow;
  taskStreaks: StreakRow[];
};

export function TaskEditForm({ task, taskStreaks }: TaskEditFormProps) {
  const [state, formAction, pending] = useActionState(
    updateTaskAction,
    initialState,
  );
  const [streakId, setStreakId] = useState(task.streakId ?? "");

  return (
    <div className="w-full">
      <Link
        href="/dashboard"
        className="mb-6 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <AppIcon name="left" className="text-sm" />
        Today&apos;s Tasks
      </Link>

      <header className="mb-8">
        <h1 className="font-heading text-3xl uppercase tracking-wider text-foreground">
          Edit Task
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Update title, notes, or streak link
        </p>
      </header>

      <form action={formAction} className="space-y-6">
        <input type="hidden" name="taskId" value={task.id} />

        {state.error ? (
          <p className="text-sm text-destructive" role="alert">
            {state.error}
          </p>
        ) : null}

        <div className="space-y-2">
          <label
            htmlFor="title"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Title
          </label>
          <input
            id="title"
            name="title"
            required
            defaultValue={task.title}
            placeholder="READ 10 PAGES"
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm font-bold uppercase tracking-widest outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <label
            htmlFor="description"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Description (optional)
          </label>
          <textarea
            id="description"
            name="description"
            rows={3}
            defaultValue={task.description ?? ""}
            placeholder="Add notes..."
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm outline-none transition-colors focus:border-primary"
          />
        </div>

        <div className="space-y-2">
          <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
            Streak link (optional)
          </p>
          <TaskStreakSelector
            value={streakId}
            onChange={setStreakId}
            streaks={mapTaskStreakOptions(taskStreaks)}
          />
        </div>

        <div className="flex gap-3 pt-2">
          <Link
            href="/dashboard"
            className="flex flex-1 items-center justify-center rounded-md border border-border bg-secondary py-3 text-xs font-bold uppercase tracking-widest text-secondary-foreground transition-all active:scale-95"
          >
            Cancel
          </Link>
          <button
            type="submit"
            disabled={pending}
            className="flex flex-1 rounded-md bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all active:scale-95 disabled:opacity-60"
          >
            {pending ? "Saving..." : "Save changes"}
          </button>
        </div>
      </form>

      <div className="mt-10 border-t border-border pt-8">
        <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
      </div>
    </div>
  );
}
