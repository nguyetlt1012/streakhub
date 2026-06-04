"use client";

import { useRouter } from "next/navigation";
import { useActionState, useEffect } from "react";
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
import { TaskCheckInPanel } from "@/components/tasks/task-check-in-panel";
import type { streaks } from "@/lib/db/schema/streaks";
import type { tasks } from "@/lib/db/schema/tasks";
import {
  checkInAction,
  type CheckInActionState,
} from "@/server/actions/check-in";

type StreakRow = typeof streaks.$inferSelect;
type TaskRow = typeof tasks.$inferSelect;

type CheckInFormProps = {
  streak: StreakRow;
  checkedInToday: boolean;
  photoUploadEnabled: boolean;
  openTasks?: TaskRow[];
};

const initialState: CheckInActionState = {};

export function CheckInForm({
  streak,
  checkedInToday,
  photoUploadEnabled,
  openTasks = [],
}: CheckInFormProps) {
  const router = useRouter();
  const [state, formAction, pending] = useActionState(checkInAction, initialState);

  useEffect(() => {
    if (state.success) {
      router.refresh();
    }
  }, [state.success, router]);

  if (streak.proofMode === "task") {
    return (
      <TaskCheckInPanel
        streakId={streak.id}
        checkedInToday={checkedInToday}
        openTasks={openTasks}
      />
    );
  }

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
        <CardTitle>Check in for today</CardTitle>
        <CardDescription>
          {streak.proofMode === "none" && "Mark today as done."}
          {streak.proofMode === "text" &&
            `Write at least ${streak.textMinLength} characters.`}
          {streak.proofMode === "photo" && "Upload a proof photo."}
        </CardDescription>
      </CardHeader>
      <form action={formAction} encType="multipart/form-data">
        <input type="hidden" name="streakId" value={streak.id} />
        <CardContent className="space-y-4">
          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="text-sm text-primary">Checked in!</p>
          ) : null}

          {streak.proofMode === "text" ? (
            <div className="space-y-2">
              <Label htmlFor={`text-${streak.id}`}>Note</Label>
              <Textarea
                id={`text-${streak.id}`}
                name="textContent"
                minLength={streak.textMinLength}
                placeholder="What did you do today?"
                required
              />
            </div>
          ) : null}

          {streak.proofMode === "photo" ? (
            <>
              {!photoUploadEnabled ? (
                <p className="text-sm text-muted-foreground">
                  Photo upload is not configured (R2).
                </p>
              ) : (
                <>
                  <div className="space-y-2">
                    <Label htmlFor={`photo-${streak.id}`}>Photo</Label>
                    <Input
                      id={`photo-${streak.id}`}
                      name="photo"
                      type="file"
                      accept="image/jpeg,image/png,image/webp"
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor={`caption-${streak.id}`}>
                      Caption (optional)
                    </Label>
                    <Input
                      id={`caption-${streak.id}`}
                      name="caption"
                      placeholder="Optional caption"
                    />
                  </div>
                </>
              )}
            </>
          ) : null}

          <Button
            type="submit"
            disabled={
              pending ||
              (streak.proofMode === "photo" && !photoUploadEnabled)
            }
          >
            {pending ? "Saving..." : "Check in"}
          </Button>
        </CardContent>
      </form>
    </Card>
  );
}
