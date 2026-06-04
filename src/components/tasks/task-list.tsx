"use client";

import Link from "next/link";
import { useActionState } from "react";
import { CompleteTaskButton } from "@/components/tasks/complete-task-button";
import { DeleteTaskButton } from "@/components/tasks/delete-task-button";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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

  return (
    <Card>
      <CardHeader>
        <CardTitle>New task</CardTitle>
        <CardDescription>
          Link to a task-proof streak to check in when you complete it.
        </CardDescription>
      </CardHeader>
      <form action={formAction}>
        <CardContent className="space-y-4">
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input id="title" name="title" required placeholder="Read 10 pages" />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="streakId">Streak (optional)</Label>
            <select
              id="streakId"
              name="streakId"
              defaultValue={defaultStreakId ?? ""}
              className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
            >
              <option value="">No streak</option>
              {taskStreaks.map((streak) => (
                <option key={streak.id} value={streak.id}>
                  {streak.name}
                </option>
              ))}
            </select>
          </div>
          <Button type="submit" disabled={pending}>
            {pending ? "Creating..." : "Create task"}
          </Button>
        </CardContent>
      </form>
    </Card>
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
            className="flex flex-wrap items-center justify-between gap-3 rounded-xl border p-3"
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
            <div className="flex items-center gap-2">
              {!done ? (
                <>
                  <CompleteTaskButton taskId={task.id} />
                  <Link
                    href={`/tasks/${task.id}/edit`}
                    className="text-sm text-primary underline-offset-4 hover:underline"
                  >
                    Edit
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
