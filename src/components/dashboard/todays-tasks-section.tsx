"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useActionState, useEffect, useState } from "react";
import { AppIcon } from "@/components/icons/app-icon";
import {
  TaskStreakSelector,
  mapTaskStreakOptions,
} from "@/components/tasks/task-streak-selector";
import {
  createTaskAction,
  completeTaskAction,
  type TaskActionState,
} from "@/server/actions/tasks";
import { cn } from "@/lib/utils";
import type { streaks } from "@/lib/db/schema/streaks";

type StreakRow = typeof streaks.$inferSelect;

type TaskItem = {
  id: string;
  title: string;
  description: string | null;
  completed: boolean;
  streakId: string | null;
};

type TodaysTasksSectionProps = {
  openTasks: TaskItem[];
  doneTodayTasks: TaskItem[];
  taskStreaks: StreakRow[];
  streakNames: Record<string, string>;
};

const initialState: TaskActionState = {};

export function TodaysTasksSection({
  openTasks,
  doneTodayTasks,
  taskStreaks,
  streakNames,
}: TodaysTasksSectionProps) {
  const router = useRouter();
  const [createState, createAction, createPending] = useActionState(
    createTaskAction,
    initialState,
  );
  const [streakId, setStreakId] = useState("");

  useEffect(() => {
    if (createState.success) {
      setStreakId("");
      router.refresh();
    }
  }, [createState.success, router]);

  const visibleTasks = [...openTasks, ...doneTodayTasks];

  return (
    <section className="mb-10 px-5">
      <div className="mb-5 flex items-center justify-between">
        <h3 className="font-heading text-2xl uppercase tracking-wider text-foreground">
          Today&apos;s Tasks
        </h3>
        <Link
          href="/tasks"
          className="text-[10px] font-bold uppercase tracking-widest text-primary"
        >
          All tasks
        </Link>
      </div>

      <form action={createAction} className="mb-4 space-y-3 rounded-lg border border-border bg-card p-4">
        <input type="hidden" name="redirectTo" value="dashboard" />
        {createState.error ? (
          <p className="text-xs text-destructive" role="alert">
            {createState.error}
          </p>
        ) : null}
        <input
          type="text"
          name="title"
          required
          placeholder="ADD A TASK FOR TODAY..."
          className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm font-bold uppercase tracking-widest outline-none transition-colors focus:border-primary"
        />
        {taskStreaks.length > 0 ? (
          <TaskStreakSelector
            value={streakId}
            onChange={setStreakId}
            streaks={mapTaskStreakOptions(taskStreaks)}
            emptyLabel="No streak link"
          />
        ) : null}
        <button
          type="submit"
          disabled={createPending}
          className="w-full rounded-md bg-secondary py-3 text-xs font-bold uppercase tracking-widest text-secondary-foreground transition-colors active:scale-95 hover:bg-secondary/80 disabled:opacity-60"
        >
          {createPending ? "Creating..." : "Create task"}
        </button>
      </form>

      {visibleTasks.length === 0 ? (
        <p className="text-sm text-muted-foreground">No tasks for today yet.</p>
      ) : (
        <div className="space-y-3">
          {visibleTasks.map((task) => (
            <TaskRow
              key={task.id}
              task={task}
              streakName={
                task.streakId ? streakNames[task.streakId] : undefined
              }
            />
          ))}
        </div>
      )}
    </section>
  );
}

function TaskRow({
  task,
  streakName,
}: {
  task: TaskItem;
  streakName?: string;
}) {
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

  const done = task.completed;

  return (
    <div className="space-y-2">
      <div
        className={cn(
          "flex items-center justify-between gap-3 rounded-lg border p-4 shadow-sm",
          done
            ? "border-primary/30 bg-card opacity-60"
            : "border-border bg-card",
        )}
      >
        <div className="min-w-0 flex-1">
          <p
            className={cn(
              "font-bold uppercase tracking-wide",
              done && "text-muted-foreground line-through",
            )}
          >
            {task.title}
          </p>
          {streakName ? (
            <p className="mt-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              {streakName}
            </p>
          ) : null}
          {done ? (
            <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-widest text-primary">
              Completed Today
            </span>
          ) : null}
        </div>
        <div className="flex shrink-0 items-center gap-2">
          {!done ? (
            <form action={formAction}>
              <input type="hidden" name="taskId" value={task.id} />
              <button
                type="submit"
                disabled={pending}
                className="group flex h-16 w-16 items-center justify-center rounded-md border border-border bg-secondary transition-all active:scale-95 hover:bg-secondary/80 disabled:opacity-60"
                aria-label={`Complete ${task.title}`}
              >
                <AppIcon
                  name="check"
                  className="text-3xl text-muted-foreground transition-colors group-active:text-primary"
                />
              </button>
            </form>
          ) : (
            <div className="flex h-16 w-16 items-center justify-center rounded-md border border-primary bg-primary">
              <AppIcon name="check" className="text-3xl text-primary-foreground" />
            </div>
          )}
          <Link
            href={`/tasks/${task.id}/edit`}
            className="flex h-16 w-16 items-center justify-center rounded-md border border-border bg-secondary text-muted-foreground transition-all active:scale-95 hover:bg-secondary/80 hover:text-foreground"
            aria-label={`Edit ${task.title}`}
          >
            <AppIcon name="edit" className="text-xl" />
          </Link>
        </div>
      </div>
      {state.error ? (
        <p className="text-xs text-destructive">{state.error}</p>
      ) : null}
    </div>
  );
}
