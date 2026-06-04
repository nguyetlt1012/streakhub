"use client";

import Link from "next/link";
import { useActionState } from "react";
import { buttonVariants } from "@/components/ui/button";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";
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

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>Edit task</CardTitle>
        <CardDescription>Update title, description, or streak link.</CardDescription>
      </CardHeader>
      <form action={formAction}>
        <input type="hidden" name="taskId" value={task.id} />
        <CardContent className="space-y-4">
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              name="title"
              required
              defaultValue={task.title}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Description (optional)</Label>
            <Textarea
              id="description"
              name="description"
              rows={2}
              defaultValue={task.description ?? ""}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="streakId">Streak (optional)</Label>
            <select
              id="streakId"
              name="streakId"
              defaultValue={task.streakId ?? ""}
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
          <div className="flex gap-2">
            <Button type="submit" disabled={pending}>
              {pending ? "Saving..." : "Save"}
            </Button>
            <Link href="/tasks" className={cn(buttonVariants({ variant: "outline" }))}>
              Cancel
            </Link>
          </div>
        </CardContent>
      </form>
    </Card>
  );
}
