"use client";

import { useCallback, useRef } from "react";
import {
  ICON_PRESET_COLUMNS,
  STREAK_ICON_PRESETS,
} from "@/lib/streaks/constants";
import { cn } from "@/lib/utils";

type IconPresetPickerProps = {
  value: string;
  onChange: (id: string) => void;
};

export function IconPresetPicker({ value, onChange }: IconPresetPickerProps) {
  const buttonRefs = useRef<(HTMLButtonElement | null)[]>([]);

  const focusAt = useCallback((index: number) => {
    const clamped = Math.max(0, Math.min(index, STREAK_ICON_PRESETS.length - 1));
    buttonRefs.current[clamped]?.focus();
    onChange(STREAK_ICON_PRESETS[clamped].id);
  }, [onChange]);

  const handleKeyDown = useCallback(
    (event: React.KeyboardEvent, index: number) => {
      const cols = ICON_PRESET_COLUMNS;
      const last = STREAK_ICON_PRESETS.length - 1;

      switch (event.key) {
        case "ArrowRight":
          event.preventDefault();
          focusAt(index + 1);
          break;
        case "ArrowLeft":
          event.preventDefault();
          focusAt(index - 1);
          break;
        case "ArrowDown":
          event.preventDefault();
          focusAt(Math.min(index + cols, last));
          break;
        case "ArrowUp":
          event.preventDefault();
          focusAt(Math.max(index - cols, 0));
          break;
        case "Home":
          event.preventDefault();
          focusAt(0);
          break;
        case "End":
          event.preventDefault();
          focusAt(last);
          break;
        default:
          break;
      }
    },
    [focusAt],
  );

  return (
    <div
      role="radiogroup"
      aria-label="Protocol icon"
      className="grid grid-cols-4 gap-2"
    >
      {STREAK_ICON_PRESETS.map((preset, index) => {
        const selected = value === preset.id;
        const Icon = preset.Icon;

        return (
          <button
            key={preset.id}
            ref={(el) => {
              buttonRefs.current[index] = el;
            }}
            type="button"
            role="radio"
            aria-checked={selected}
            aria-label={preset.label}
            tabIndex={selected ? 0 : -1}
            onClick={() => onChange(preset.id)}
            onKeyDown={(event) => handleKeyDown(event, index)}
            className={cn(
              "flex min-h-[4.5rem] flex-col items-center justify-center gap-1.5 rounded-lg border p-2 transition-all active:scale-95",
              "outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 focus-visible:ring-offset-background",
              selected
                ? "border-primary bg-primary/10 text-primary"
                : "border-border bg-background text-foreground hover:border-primary/40 hover:bg-secondary/50",
            )}
          >
            <Icon className="size-5 shrink-0" aria-hidden />
            <span className="w-full truncate text-center text-[10px] font-bold uppercase tracking-wide">
              {preset.label}
            </span>
          </button>
        );
      })}
    </div>
  );
}
