"use client";

import Link from "next/link";
import { useActionState, useState } from "react";
import { AppIcon } from "@/components/icons/app-icon";
import { CompleteTaskButton } from "@/components/tasks/complete-task-button";
import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import {
  TaskStreakSelector,
  mapTaskStreakOptions,
} from "@/components/tasks/task-streak-selector";
import type { streaks } from "@/lib/db/schema/streaks";
import {
  createTaskAction,
  type TaskActionState,
} from "@/server/actions/tasks";

type StreakRow = typeof streaks.$inferSelect;

const initialState: TaskActionState = {};

type TaskCreateFormProps = {
  taskStreaks: StreakRow[];
  defaultStreakId?: string;
};

export function TaskCreateForm({
  taskStreaks,
  defaultStreakId,
}: TaskCreateFormProps) {
  const [state, formAction, pending] = useActionState(
    createTaskAction,
    initialState,
  );
  const [streakId, setStreakId] = useState(defaultStreakId ?? "");

  return (
    <div className="space-y-6">
      <div>
        <h2 className="font-heading text-xl uppercase tracking-wider text-foreground">
          New Task
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Link to a task-proof streak to check in when you complete it.
        </p>
      </div>

      <form action={formAction} className="space-y-4 rounded-lg border border-border bg-card p-4">
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
            placeholder="READ 10 PAGES"
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-base font-bold uppercase tracking-widest outline-none focus:border-primary"
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
            rows={2}
            placeholder="Add notes..."
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-base outline-none focus:border-primary"
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

        <button
          type="submit"
          disabled={pending}
          className="w-full rounded-md bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground active:scale-95 disabled:opacity-60"
        >
          {pending ? "Creating..." : "Create task"}
        </button>
      </form>
    </div>
  );
}

type TaskListProps = {
  tasks: Array<{
    id: string;
    title: string;
    description: string | null;
    completed: boolean;
    completedAt: Date | null;
    streakId: string | null;
  }>;
  streakNames: Record<string, string>;
};

export function TaskList({ tasks, streakNames }: TaskListProps) {
  const open = tasks.filter((t) => !t.completed);
  const done = tasks.filter((t) => t.completed);

  if (tasks.length === 0) {
    return <p className="text-sm text-muted-foreground">No tasks yet.</p>;
  }

  return (
    <div className="space-y-6">
      <TaskSection title="Open" items={open} streakNames={streakNames} />
      <TaskSection title="Completed" items={done} streakNames={streakNames} done />
    </div>
  );
}

function TaskSection({
  title,
  items,
  streakNames,
  done = false,
}: {
  title: string;
  items: TaskListProps["tasks"];
  streakNames: Record<string, string>;
  done?: boolean;
}) {
  if (items.length === 0) {
    return null;
  }

  return (
    <section className="space-y-2">
      <h2 className="text-sm font-medium text-muted-foreground">{title}</h2>
      <ul className="space-y-2">
        {items.map((task) => (
          <li
            key={task.id}
            className="flex items-center justify-between gap-3 rounded-xl border border-border bg-card p-3 shadow-sm"
          >
            <div className="min-w-0 flex-1 space-y-1">
              <p
                className={
                  done ? "text-muted-foreground line-through" : "font-medium"
                }
              >
                {task.title}
              </p>
              {task.description ? (
                <p className="text-sm text-muted-foreground">{task.description}</p>
              ) : null}
              {task.streakId && streakNames[task.streakId] ? (
                <p className="text-xs text-muted-foreground">
                  {streakNames[task.streakId]}
                </p>
              ) : null}
            </div>
            <div className="flex shrink-0 items-center gap-2">
              {!done ? (
                <>
                  <CompleteTaskButton taskId={task.id} taskTitle={task.title} />
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    aria-label={`Edit ${task.title}`}
                    className="flex h-11 w-11 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground transition-all active:scale-95 hover:text-foreground"
                  >
                    <AppIcon name="edit" className="text-xl" />
                  </Link>
                </>
              ) : null}
              <DeleteTaskButton taskId={task.id} taskTitle={task.title} />
            </div>
          </li>
        ))}
      </ul>
    </section>
  );
}
