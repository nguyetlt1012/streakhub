"use client";

import { useActionState, useState } from "react";
import { TimePicker } from "@/components/ui/time-picker";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DEFAULT_REMINDER_INTERVAL_MINUTES,
  MAX_REMINDER_INTERVAL_MINUTES,
  MIN_REMINDER_INTERVAL_MINUTES,
} from "@/lib/user/reminder-constants";
import {
  updateReminderSettingsAction,
  type ReminderSettingsActionState,
} from "@/server/actions/settings";

type ReminderSettingsProps = {
  timezone: string;
  morningBriefTime: string;
  reminderIntervalMinutes: number;
};

const initialState: ReminderSettingsActionState = {};

export function ReminderSettings({
  timezone: initialTimezone,
  morningBriefTime: initialMorningBriefTime,
  reminderIntervalMinutes: initialInterval,
}: ReminderSettingsProps) {
  const [state, formAction, pending] = useActionState(
    updateReminderSettingsAction,
    initialState,
  );
  const [timezone] = useState(initialTimezone);
  const [morningBriefTime, setMorningBriefTime] = useState(
    initialMorningBriefTime,
  );
  const [reminderIntervalMinutes, setReminderIntervalMinutes] = useState(
    String(initialInterval),
  );

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle>Reminders</CardTitle>
        <CardDescription>
          Morning digest and repeat alerts apply to all protocols via Telegram.
        </CardDescription>
      </CardHeader>
      <CardContent>
        <form action={formAction} className="space-y-5">
          <input type="hidden" name="timezone" value={timezone} />

          {state.error ? (
            <p className="text-sm text-destructive" role="alert">
              {state.error}
            </p>
          ) : null}
          {state.success ? (
            <p className="text-sm font-medium text-primary">Settings saved.</p>
          ) : null}

          <div className="space-y-2">
            <label
              htmlFor="morningBriefTime"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Morning brief
            </label>
            <TimePicker
              id="morningBriefTime"
              name="morningBriefTime"
              value={morningBriefTime}
              onChange={setMorningBriefTime}
            />
            <p className="text-sm text-muted-foreground">
              Once each morning, Telegram lists protocols you still need to
              check in today (uses your timezone above).
            </p>
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reminderIntervalMinutes"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Repeat interval (minutes)
            </label>
            <input
              id="reminderIntervalMinutes"
              name="reminderIntervalMinutes"
              type="number"
              min={MIN_REMINDER_INTERVAL_MINUTES}
              max={MAX_REMINDER_INTERVAL_MINUTES}
              step={5}
              inputMode="numeric"
              value={reminderIntervalMinutes}
              onChange={(e) => setReminderIntervalMinutes(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-4 py-3 text-lg font-heading outline-none focus:border-primary"
            />
            <p className="text-sm text-muted-foreground">
              After each protocol&apos;s reminder time, send another alert every{" "}
              {reminderIntervalMinutes || DEFAULT_REMINDER_INTERVAL_MINUTES}{" "}
              minutes until you check in.
            </p>
          </div>

          <Button
            type="submit"
            disabled={pending}
            className="w-full uppercase tracking-widest"
          >
            {pending ? "Saving..." : "Save reminder settings"}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
}
