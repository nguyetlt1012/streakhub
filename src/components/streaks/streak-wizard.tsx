"use client";

import { useActionState, useEffect, useRef, useState } from "react";
import Link from "next/link";
import { AppIcon } from "@/components/icons/app-icon";
import { IconPresetPicker } from "@/components/streaks/icon-preset-picker";
import { StreakIcon } from "@/components/streaks/streak-icon";
import { TimePicker, detectUserTimezone } from "@/components/ui/time-picker";
import {
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
  const [timezone, setTimezone] = useState(() => detectUserTimezone());
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
    setTimezone(detectUserTimezone());
  }, []);

  useEffect(() => {
    if (!avatarFile) {
      return;
    }
    const url = URL.createObjectURL(avatarFile);
    setAvatarPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [avatarFile]);

  function validateStep(current: number): string | null {
    if (current === 1) {
      if (!name.trim()) return "Name is required.";
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

  const backHref =
    mode === "edit" && streakId ? `/streaks/${streakId}` : "/streaks";

  return (
    <div className="w-full">
      <Link
        href={backHref}
        className="mb-6 inline-flex items-center gap-1 text-[10px] font-bold uppercase tracking-widest text-muted-foreground transition-colors hover:text-foreground"
      >
        <AppIcon name="left" className="text-sm" />
        {mode === "edit" ? "Protocol" : "Back"}
      </Link>

      <header className="mb-8">
        <h1 className="font-heading text-3xl uppercase tracking-wider text-foreground">
          {mode === "create" ? "New Protocol" : "Edit Protocol"}
        </h1>
        <p className="mt-1 text-xs font-bold uppercase tracking-widest text-muted-foreground">
          Step {step} of {totalSteps} — {stepTitles[step - 1]}
        </p>
        <div className="mt-4 flex gap-1">
          {stepTitles.map((title, index) => (
            <div
              key={title}
              className={cn(
                "h-1 flex-1 rounded-full",
                index + 1 <= step ? "bg-primary" : "bg-secondary",
              )}
            />
          ))}
        </div>
      </header>

      <form ref={formRef} action={formAction} onSubmit={handleFormSubmit}>
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

        {(state.error || stepError) && (
          <p className="mb-6 text-sm text-destructive" role="alert">
            {stepError ?? state.error}
          </p>
        )}

        <div className={step === 1 ? "space-y-6" : "hidden"}>
          <div className="space-y-2">
            <label
              htmlFor="name"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Name
            </label>
            <input
              id="name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="DAILY READING"
              className="w-full rounded-md border border-border bg-input px-4 py-3 text-sm font-bold uppercase tracking-widest outline-none transition-colors focus:border-primary"
            />
          </div>

          <div className="space-y-2">
            <label
              htmlFor="reminderTime"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Daily reminder
            </label>
            <TimePicker
              id="reminderTime"
              value={reminderTime}
              onChange={setReminderTime}
            />
          </div>

          <div className="space-y-3">
            <p className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
              Icon
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setIconType("preset")}
                className={cn(
                  "rounded-md px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95",
                  iconType === "preset"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary text-secondary-foreground",
                )}
              >
                Preset
              </button>
              <button
                type="button"
                onClick={() => setIconType("upload")}
                disabled={!avatarUploadEnabled}
                className={cn(
                  "rounded-md px-4 py-2 text-[10px] font-bold uppercase tracking-widest transition-all active:scale-95 disabled:opacity-40",
                  iconType === "upload"
                    ? "bg-primary text-primary-foreground"
                    : "border border-border bg-secondary text-secondary-foreground",
                )}
              >
                Upload
              </button>
            </div>

            {!avatarUploadEnabled ? (
              <p className="text-xs text-muted-foreground">
                Configure R2 storage to enable avatar uploads.
              </p>
            ) : null}

            {iconType === "preset" ? (
              <>
                <p className="text-xs text-muted-foreground">
                  Arrow keys to move, Enter to select.
                </p>
                <IconPresetPicker value={iconPreset} onChange={setIconPreset} />
              </>
            ) : (
              <div className="space-y-4 rounded-lg border border-border bg-card p-4">
                <input
                  type="file"
                  name="avatar"
                  accept="image/jpeg,image/png,image/webp"
                  onChange={(e) => setAvatarFile(e.target.files?.[0] ?? null)}
                  className="w-full text-sm file:mr-3 file:rounded file:border-0 file:bg-secondary file:px-3 file:py-2 file:text-xs file:font-bold file:uppercase file:tracking-widest"
                />
                {avatarPreview ? (
                  <StreakIcon
                    iconType="upload"
                    avatarUrl={avatarPreview}
                    size="lg"
                    className="rounded-md border border-border bg-background"
                  />
                ) : null}
              </div>
            )}
          </div>
        </div>

        <div className={step === 2 ? "space-y-4" : "hidden"}>
          <label
            htmlFor="freezePerMonth"
            className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
          >
            Freezes per month
          </label>
          <input
            id="freezePerMonth"
            type="number"
            min={0}
            inputMode="numeric"
            value={freezePerMonth}
            onChange={(e) => setFreezePerMonth(e.target.value)}
            className="w-full rounded-md border border-border bg-input px-4 py-3 text-lg font-heading outline-none focus:border-primary"
          />
          <p className="text-sm text-muted-foreground">
            When you miss a day, one freeze is used automatically if you have
            quota left — your streak won&apos;t reset. Quota resets at the start
            of each month in your local timezone.
          </p>
        </div>

        <div className={step === 3 ? "space-y-4" : "hidden"}>
          <p className="text-sm text-muted-foreground">
            How will you prove you completed today&apos;s habit?
          </p>
          <div
            role="radiogroup"
            aria-label="Proof mode"
            className="space-y-3"
          >
            {PROOF_MODE_OPTIONS.map((option) => (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={proofMode === option.value}
                onClick={() => setProofMode(option.value)}
                className={cn(
                  "w-full rounded-lg border p-4 text-left transition-all active:scale-[0.99] outline-none focus-visible:ring-2 focus-visible:ring-primary",
                  proofMode === option.value
                    ? "border-primary bg-primary/10"
                    : "border-border bg-card hover:border-primary/30",
                )}
              >
                <div className="flex items-center justify-between gap-2">
                  <span className="font-bold uppercase tracking-wide">
                    {option.label}
                  </span>
                  <span className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground">
                    {option.suggestedFor[0]}
                  </span>
                </div>
                <p className="mt-2 text-sm text-muted-foreground">
                  {option.description}
                </p>
              </button>
            ))}
          </div>
        </div>

        {mode === "create" ? (
          <div className={step === 4 ? "space-y-4" : "hidden"}>
            <label
              htmlFor="initialStreak"
              className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
            >
              Initial streak (optional)
            </label>
            <input
              id="initialStreak"
              type="number"
              min={0}
              inputMode="numeric"
              placeholder="0"
              value={initialStreak}
              onChange={(e) => setInitialStreak(e.target.value)}
              className="w-full rounded-md border border-border bg-input px-4 py-3 text-lg font-heading outline-none focus:border-primary"
            />
            <p className="text-sm text-muted-foreground">
              Sets your displayed streak count only — no past check-ins are
              created. You still need to check in today to keep going.
            </p>
            {Number.parseInt(initialStreak, 10) > 0 ? (
              <span className="inline-block rounded border border-border bg-secondary px-2 py-1 text-[10px] font-bold uppercase tracking-widest text-secondary-foreground">
                Will show &quot;Started at {initialStreak}&quot;
              </span>
            ) : null}
          </div>
        ) : null}

        <div className="mt-10 flex gap-3">
          <button
            type="button"
            onClick={goBack}
            disabled={step === 1 || pending}
            className="flex-1 rounded-md border border-border bg-secondary py-3 text-xs font-bold uppercase tracking-widest text-secondary-foreground transition-all active:scale-95 disabled:opacity-40"
          >
            Back
          </button>
          {step < totalSteps ? (
            <button
              type="button"
              onClick={goNext}
              className="flex-1 rounded-md bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all active:scale-95"
            >
              Next
            </button>
          ) : (
            <button
              type="button"
              disabled={pending}
              onClick={handleFinalSubmit}
              className="flex-1 rounded-md bg-primary py-3 text-xs font-bold uppercase tracking-widest text-primary-foreground transition-all active:scale-95 disabled:opacity-60"
            >
              {pending
                ? "Saving..."
                : mode === "create"
                  ? "Create protocol"
                  : "Save changes"}
            </button>
          )}
        </div>
      </form>
    </div>
  );
}
