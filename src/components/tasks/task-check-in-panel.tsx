"use client";

import Link from "next/link";
import { CompleteTaskButton } from "@/components/tasks/complete-task-button";
import { buttonVariants } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";
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
      <Card>
        <CardHeader>
          <CardTitle>Today</CardTitle>
          <CardDescription>You checked in for today.</CardDescription>
        </CardHeader>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Check in via task</CardTitle>
        <CardDescription>
          Complete a linked task below to check in for today.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-3">
        {openTasks.length === 0 ? (
          <div className="space-y-2 text-sm text-muted-foreground">
            <p>No open tasks linked to this streak.</p>
            <Link
              href={`/tasks?streakId=${streakId}`}
              className={cn(buttonVariants({ size: "sm" }))}
            >
              Add a task
            </Link>
          </div>
        ) : (
          <ul className="space-y-2">
            {openTasks.map((task) => (
              <li
                key={task.id}
                className="flex items-center justify-between gap-3 rounded-lg border px-3 py-2"
              >
                <div className="min-w-0">
                  <p className="font-medium">{task.title}</p>
                  {task.description ? (
                    <p className="text-sm text-muted-foreground">
                      {task.description}
                    </p>
                  ) : null}
                </div>
                <CompleteTaskButton taskId={task.id} />
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}
