"use client";

import { useActionState, useEffect, useMemo, useRef, useState } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { StreakIcon } from "@/components/streaks/streak-icon";
import {
  COMMON_TIMEZONES,
  PROOF_MODE_OPTIONS,
  STREAK_ICON_PRESETS,
  type ProofMode,
} from "@/lib/streaks/constants";
import { cn } from "@/lib/utils";
import {
  createStreakAction,
  updateStreakAction,
  type StreakActionState,
} from "@/server/actions/streaks";

const initialState: StreakActionState = {};

export type StreakWizardInitialValues = {
  name: string;
  timezone: string;
  reminderTime: string;
  iconType: "preset" | "upload";
  iconPreset: string;
  proofMode: ProofMode;
  freezePerMonth: number;
  avatarUrl?: string | null;
};

type StreakWizardProps = {
  mode: "create" | "edit";
  streakId?: string;
  initialValues?: StreakWizardInitialValues;
  avatarUploadEnabled: boolean;
};

function detectTimezone() {
  try {
    return Intl.DateTimeFormat().resolvedOptions().timeZone;
  } catch {
    return "UTC";
  }
}

export function StreakWizard({
  mode,
  streakId,
  initialValues,
  avatarUploadEnabled,
}: StreakWizardProps) {
  const action = mode === "create" ? createStreakAction : updateStreakAction;
  const [state, formAction, pending] = useActionState(action, initialState);

  const totalSteps = mode === "create" ? 4 : 3;
  const [step, setStep] = useState(1);

  const [name, setName] = useState(initialValues?.name ?? "");
  const [timezone, setTimezone] = useState(
    initialValues?.timezone ?? detectTimezone(),
  );
  const [reminderTime, setReminderTime] = useState(
    initialValues?.reminderTime ?? "09:00",
  );
  const [iconType, setIconType] = useState<"preset" | "upload">(
    initialValues?.iconType ?? "preset",
  );
  const [iconPreset, setIconPreset] = useState(
    initialValues?.iconPreset ?? STREAK_ICON_PRESETS[0].id,
  );
  const [proofMode, setProofMode] = useState<ProofMode>(
    initialValues?.proofMode ?? "none",
  );
  const [freezePerMonth, setFreezePerMonth] = useState(
    String(initialValues?.freezePerMonth ?? 0),
  );
  const [initialStreak, setInitialStreak] = useState("");
  const [avatarFile, setAvatarFile] = useState<File | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(
    initialValues?.avatarUrl ?? null,
  );
  const [stepError, setStepError] = useState<string | null>(null);
  const formRef = useRef<HTMLFormElement>(null);

  useEffect(() => {
    if (!avatarFile) {
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  const timezoneOptions = useMemo(() => {
    const set = new Set<string>(COMMON_TIMEZONES);
    if (timezone) {
      set.add(timezone);
    }
    return Array.from(set).sort();
  }, [timezone]);

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (!name.trim()) return "Name is required.";
      if (!timezone) return "Timezone is required.";
      if (!reminderTime) return "Reminder time is required.";
      if (iconType === "preset" && !iconPreset) return "Select an icon.";
      if (iconType === "upload" && !avatarUploadEnabled) {
        return "Avatar upload is not configured. Choose a preset icon.";
      }
      if (iconType === "upload" && !avatarFile && !initialValues?.avatarUrl) {
        return "Upload an avatar image.";
      }
    }
    if (current === 2) {
      const n = Number.parseInt(freezePerMonth, 10);
      if (Number.isNaN(n) || n < 0) return "Freezes per month must be 0 or more.";
    }
    if (current === 3) {
      if (!proofMode) return "Select a proof mode.";
    }
    if (current === 4 && mode === "create") {
      const trimmed = initialStreak.trim();
      if (trimmed === "") return null;
      const n = Number.parseInt(trimmed, 10);
      if (Number.isNaN(n) || n < 0) return "Initial streak must be 0 or more.";
    }
    return null;
  }

  function goNext() {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    // Defer step change so the same click cannot hit the submit button
    // that replaces "Next" in the same screen position (step 3 → 4).
    window.setTimeout(() => {
      setStep((s) => Math.min(s + 1, totalSteps));
    }, 0);
  }

  function handleFormSubmit(event: React.FormEvent<HTMLFormElement>) {
    if (step !== totalSteps) {
      event.preventDefault();
      return;
    }
    const error = validateStep(step);
    if (error) {
      event.preventDefault();
      setStepError(error);
    }
  }

  function goBack() {
    setStepError(null);
    setStep((s) => Math.max(s - 1, 1));
  }

  function handleFinalSubmit() {
    const error = validateStep(step);
    if (error) {
      setStepError(error);
      return;
    }
    setStepError(null);
    formRef.current?.requestSubmit();
  }

  const stepTitles = [
    "Basics",
    "Freezes",
    "Proof",
    ...(mode === "create" ? ["Starting streak"] : []),
  ];

  return (
    <Card className="w-full max-w-lg">
      <CardHeader>
        <CardTitle>{mode === "create" ? "New streak" : "Edit streak"}</CardTitle>
        <CardDescription>
          Step {step} of {totalSteps} — {stepTitles[step - 1]}
        </CardDescription>
        <div className="flex gap-1 pt-2">
          {stepTitles.map((_, index) => (
            <div
              key={stepTitles[index]}
              className={cn(
                "h-1 flex-1 rounded-full",
                index + 1 <= step ? "bg-primary" : "bg-muted",
              )}
            />
          ))}
        </div>
      </CardHeader>

      <form
        ref={formRef}
        action={formAction}
        encType="multipart/form-data"
        onSubmit={handleFormSubmit}
      >
        {mode === "edit" && streakId ? (
          <input type="hidden" name="streakId" value={streakId} />
        ) : null}

        <input type="hidden" name="name" value={name} />
        <input type="hidden" name="timezone" value={timezone} />
        <input type="hidden" name="reminderTime" value={reminderTime} />
        <input type="hidden" name="iconType" value={iconType} />
        <input type="hidden" name="iconPreset" value={iconPreset} />
        <input type="hidden" name="proofMode" value={proofMode} />
        <input type="hidden" name="freezePerMonth" value={freezePerMonth} />
        {mode === "create" ? (
          <input
            type="hidden"
            name="initialStreak"
            value={initialStreak.trim() === "" ? "0" : initialStreak}
          />
        ) : null}

        <CardContent className="space-y-6">
          {(state.error || stepError) && (
            <p className="text-sm text-destructive" role="alert">
              {stepError ?? state.error}
            </p>
          )}

          <div className={step === 1 ? "space-y-4" : "hidden"}>
              <div className="space-y-2">
                <Label htmlFor="name">Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Daily reading"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="timezone">Timezone</Label>
                <select
                  id="timezone"
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="flex h-8 w-full rounded-lg border border-input bg-transparent px-2.5 text-sm outline-none focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 dark:bg-input/30"
                >
                  {timezoneOptions.map((tz) => (
                    <option key={tz} value={tz}>
                      {tz}
                    </option>
                  ))}
                </select>
                <p className="text-xs text-muted-foreground">
                  Streak days reset at midnight in this timezone.
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="reminderTime">Daily reminder</Label>
                <Input
                  id="reminderTime"
                  type="time"
                  value={reminderTime}
                  onChange={(e) => setReminderTime(e.target.value)}
                />
              </div>

              <Separator />

              <div className="space-y-3">
                <Label>Icon</Label>
                <div className="flex gap-2">
                  <Button
                    type="button"
                    size="sm"
                    variant={iconType === "preset" ? "default" : "outline"}
                    onClick={() => setIconType("preset")}
                  >
                    Preset
                  </Button>
                  <Button
                    type="button"
                    size="sm"
                    variant={iconType === "upload" ? "default" : "outline"}
                    onClick={() => setIconType("upload")}
                    disabled={!avatarUploadEnabled}
                  >
                    Upload
                  </Button>
                </div>
                {!avatarUploadEnabled ? (
                  <p className="text-xs text-muted-foreground">
                    Configure R2 storage to enable avatar uploads.
                  </p>
                ) : null}

                {iconType === "preset" ? (
                  <div className="grid grid-cols-5 gap-2">
                    {STREAK_ICON_PRESETS.map((preset) => (
                      <button
                        key={preset.id}
                        type="button"
                        onClick={() => setIconPreset(preset.id)}
                        className={cn(
                          "flex flex-col items-center gap-1 rounded-lg border p-2 text-xs transition-colors",
                          iconPreset === preset.id
                            ? "border-primary bg-primary/5"
                            : "hover:bg-muted",
                        )}
                        title={preset.label}
                      >
                        <preset.Icon className="size-5" />
                        <span className="truncate w-full text-center">{preset.label}</span>
                      </button>
                    ))}
                  </div>
                ) : (
                  <div className="space-y-3">
                    <Input
                      type="file"
                      name="avatar"
                      accept="image/jpeg,image/png,image/webp"
                      onChange={(e) =>
                        setAvatarFile(e.target.files?.[0] ?? null)
                      }
                    />
                    {avatarPreview ? (
                      <StreakIcon
                        iconType="upload"
                        avatarUrl={avatarPreview}
                        size="lg"
                      />
                    ) : null}
                  </div>
                )}
              </div>
          </div>

          <div className={step === 2 ? "space-y-4" : "hidden"}>
            <div className="space-y-2">
              <Label htmlFor="freezePerMonth">Freezes per month</Label>
              <Input
                id="freezePerMonth"
                type="number"
                min={0}
                value={freezePerMonth}
                onChange={(e) => setFreezePerMonth(e.target.value)}
              />
              <p className="text-sm text-muted-foreground">
                When you miss a day, one freeze is used automatically if you
                have quota left — your streak won&apos;t reset. Quota resets at
                the start of each month in your streak timezone.
              </p>
            </div>
          </div>

          <div className={step === 3 ? "space-y-3" : "hidden"}>
            <p className="text-sm text-muted-foreground">
              How will you prove you completed today&apos;s habit?
            </p>
            <div className="space-y-2">
              {PROOF_MODE_OPTIONS.map((option) => (
                <button
                  key={option.value}
                  type="button"
                  onClick={() => setProofMode(option.value)}
                  className={cn(
                    "w-full rounded-xl border p-4 text-left transition-colors",
                    proofMode === option.value
                      ? "border-primary bg-primary/5"
                      : "hover:bg-muted/50",
                  )}
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="font-medium">{option.label}</span>
                    <div className="flex flex-wrap gap-1">
                      {option.suggestedFor.map((tag) => (
                        <Badge key={tag} variant="secondary">
                          {tag}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <p className="mt-1 text-sm text-muted-foreground">
                    {option.description}
                  </p>
                </button>
              ))}
            </div>
          </div>

          {mode === "create" ? (
            <div className={step === 4 ? "space-y-4" : "hidden"}>
              <div className="space-y-2">
                <Label htmlFor="initialStreak">Initial streak (optional)</Label>
                <Input
                  id="initialStreak"
                  type="number"
                  min={0}
                  placeholder="0"
                  value={initialStreak}
                  onChange={(e) => setInitialStreak(e.target.value)}
                />
                <p className="text-sm text-muted-foreground">
                  Sets your displayed streak count only — no past check-ins are
                  created. You still need to check in today to keep going.
                </p>
              </div>
              {Number.parseInt(initialStreak, 10) > 0 ? (
                <Badge variant="secondary">
                  Will show &quot;Started at {initialStreak}&quot; badge
                </Badge>
              ) : null}
            </div>
          ) : null}
        </CardContent>

        <CardFooter className="flex justify-between gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={goBack}
            disabled={step === 1 || pending}
          >
            Back
          </Button>
          {step < totalSteps ? (
            <Button type="button" onClick={goNext}>
              Next
            </Button>
          ) : (
            <Button type="button" disabled={pending} onClick={handleFinalSubmit}>
              {pending
                ? "Saving..."
                : mode === "create"
                  ? "Create streak"
                  : "Save changes"}
            </Button>
          )}
        </CardFooter>
      </form>
    </Card>
  );
}
