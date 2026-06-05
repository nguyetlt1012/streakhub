"use client";

import Link from "next/link";
import { AppIcon } from "@/components/icons/app-icon";
import { CompleteTaskButton } from "@/components/tasks/complete-task-button";
import type { tasks } from "@/lib/db/schema/tasks";

type TaskRow = typeof tasks.$inferSelect;

type TaskCheckInPanelProps = {
  streakId: string;
  checkedInToday: boolean;
  openTasks: TaskRow[];
};

export function TaskCheckInPanel({
  streakId,
  checkedInToday,
  openTasks,
}: TaskCheckInPanelProps) {
  if (checkedInToday) {
    return (
      <section className="mb-10">
        <h2 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
          Today
        </h2>
        <div className="flex items-center justify-between rounded-lg border border-primary/30 bg-card p-4 opacity-90 shadow-sm">
          <div>
            <span className="text-[10px] font-bold uppercase tracking-widest text-primary">
              Completed Today
            </span>
            <p className="mt-2 text-sm text-muted-foreground">
              You checked in for today.
            </p>
          </div>
          <div className="flex h-16 w-16 shrink-0 items-center justify-center rounded-md border border-primary bg-primary">
            <AppIcon name="check" className="text-3xl text-primary-foreground" />
          </div>
        </div>
      </section>
    );
  }

  return (
    <section className="mb-10">
      <h2 className="mb-4 font-heading text-xl uppercase tracking-wider text-foreground">
        Check In
      </h2>
      <div className="rounded-lg border border-border bg-card p-5 shadow-sm">
        <p className="mb-4 text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
          Complete a linked task to check in
        </p>

        {openTasks.length === 0 ? (
          <div className="space-y-4">
            <p className="text-sm text-muted-foreground">
              No open tasks linked to this streak.
            </p>
            <Link
              href={`/tasks?streakId=${streakId}`}
              className="inline-block rounded-md bg-secondary px-4 py-3 text-xs font-bold uppercase tracking-widest text-secondary-foreground transition-colors active:scale-95 hover:bg-secondary/80"
            >
              Add a task
            </Link>
          </div>
        ) : (
          <ul className="space-y-3">
            {openTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border border-border bg-background p-4"
              >
                <div className="min-w-0">
                  <p className="font-bold uppercase tracking-wide text-foreground">
                    {task.title}
                  </p>
                  {task.description ? (
                    <p className="mt-1 text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  ) : null}
                </div>
                <CompleteTaskButton taskId={task.id} variant="stamp" />
              </li>
            ))}
          </ul>
        )}
      </div>
    </section>
  );
}
