"use client";

import { Icon } from "@iconify/react";
import { useEffect, useId, useRef, useState, type ChangeEvent } from "react";
import {
  ALLOWED_AVATAR_TYPES,
  MAX_AVATAR_BYTES,
} from "@/lib/streaks/constants";
import { cn } from "@/lib/utils";

const ACCEPT = "image/jpeg,image/png,image/webp";

type PhotoProofPickerProps = {
  inputName?: string;
  disabled?: boolean;
  onFileChange?: (file: File | null) => void;
  captionId?: string;
  captionName?: string;
};

function formatBytes(bytes: number): string {
  if (bytes >= 1024 * 1024) {
    return `${Math.round(bytes / (1024 * 1024))} MB`;
  }
  return `${Math.round(bytes / 1024)} KB`;
}

function validatePhotoFile(file: File): string | null {
  if (!ALLOWED_AVATAR_TYPES.includes(file.type as (typeof ALLOWED_AVATAR_TYPES)[number])) {
    return "Use JPEG, PNG, or WebP.";
  }
  if (file.size > MAX_AVATAR_BYTES) {
    return `Photo must be ${formatBytes(MAX_AVATAR_BYTES)} or smaller.`;
  }
  return null;
}

function assignFileToInput(input: HTMLInputElement | null, file: File | null) {
  if (!input) return;
  const dataTransfer = new DataTransfer();
  if (file) {
    dataTransfer.items.add(file);
  }
  input.files = dataTransfer.files;
}

export function PhotoProofPicker({
  inputName = "photo",
  disabled = false,
  onFileChange,
  captionId,
  captionName = "caption",
}: PhotoProofPickerProps) {
  const reactId = useId();
  const captionFieldId = captionId ?? `${reactId}-caption`;
  const formInputRef = useRef<HTMLInputElement>(null);
  const cameraInputRef = useRef<HTMLInputElement>(null);
  const galleryInputRef = useRef<HTMLInputElement>(null);
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    return () => {
      if (previewUrl) {
        URL.revokeObjectURL(previewUrl);
      }
    };
  }, [previewUrl]);

  function clearPhoto() {
    assignFileToInput(formInputRef.current, null);
    if (cameraInputRef.current) cameraInputRef.current.value = "";
    if (galleryInputRef.current) galleryInputRef.current.value = "";
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return null;
    });
    setError(null);
    onFileChange?.(null);
  }

  function applyFile(file: File | null) {
    if (!file) {
      clearPhoto();
      return;
    }

    const validationError = validatePhotoFile(file);
    if (validationError) {
      setError(validationError);
      assignFileToInput(formInputRef.current, null);
      setPreviewUrl((current) => {
        if (current) URL.revokeObjectURL(current);
        return null;
      });
      onFileChange?.(null);
      return;
    }

    setError(null);
    assignFileToInput(formInputRef.current, file);
    setPreviewUrl((current) => {
      if (current) URL.revokeObjectURL(current);
      return URL.createObjectURL(file);
    });
    onFileChange?.(file);
  }

  function handleSourceChange(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0] ?? null;
    applyFile(file);
    event.target.value = "";
  }

  return (
    <div className="space-y-3">
      <input
        ref={formInputRef}
        type="file"
        name={inputName}
        accept={ACCEPT}
        required
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={() => {}}
      />

      <input
        ref={cameraInputRef}
        type="file"
        accept={ACCEPT}
        capture="environment"
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={handleSourceChange}
      />

      <input
        ref={galleryInputRef}
        type="file"
        accept={ACCEPT}
        className="sr-only"
        tabIndex={-1}
        aria-hidden
        disabled={disabled}
        onChange={handleSourceChange}
      />

      {previewUrl ? (
        <div className="flex justify-start">
          <div className="relative max-w-[min(100%,280px)]">
            <div className="overflow-hidden rounded-2xl rounded-bl-md border border-border bg-muted/40 shadow-sm">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img
                src={previewUrl}
                alt="Proof preview"
                className="max-h-64 w-full object-cover"
              />
            </div>
            <button
              type="button"
              disabled={disabled}
              onClick={clearPhoto}
              className="absolute -right-2 -top-2 flex size-8 items-center justify-center rounded-full border border-border bg-card text-muted-foreground shadow-md transition-colors hover:bg-secondary hover:text-foreground disabled:opacity-50"
              aria-label="Remove photo"
            >
              <Icon icon="mingcute:close-line" className="text-lg" />
            </button>
          </div>
        </div>
      ) : null}

      <div
        className={cn(
          "rounded-2xl border border-dashed border-border bg-muted/20 p-3",
          disabled && "opacity-50",
        )}
      >
        <p className="mb-3 text-center text-xs text-muted-foreground">
          {previewUrl ? "Replace photo" : "Add a proof photo"}
        </p>
        <div className="grid grid-cols-2 gap-2">
          <button
            type="button"
            disabled={disabled}
            onClick={() => cameraInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center transition-colors hover:border-primary/40 hover:bg-secondary/60 active:scale-[0.98] disabled:pointer-events-none"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Icon icon="mingcute:camera-2-line" className="text-2xl" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
              Camera
            </span>
            <span className="text-[10px] text-muted-foreground">Take photo</span>
          </button>

          <button
            type="button"
            disabled={disabled}
            onClick={() => galleryInputRef.current?.click()}
            className="flex flex-col items-center gap-2 rounded-xl border border-border bg-card px-3 py-4 text-center transition-colors hover:border-primary/40 hover:bg-secondary/60 active:scale-[0.98] disabled:pointer-events-none"
          >
            <span className="flex size-11 items-center justify-center rounded-full bg-primary/15 text-primary">
              <Icon icon="mingcute:photo-album-line" className="text-2xl" />
            </span>
            <span className="text-[10px] font-bold uppercase tracking-widest text-foreground">
              Library
            </span>
            <span className="text-[10px] text-muted-foreground">
              Choose photo
            </span>
          </button>
        </div>
      </div>

      {error ? (
        <p className="text-sm text-destructive" role="alert">
          {error}
        </p>
      ) : null}

      <div className="space-y-2">
        <label
          htmlFor={captionFieldId}
          className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground"
        >
          Caption (optional)
        </label>
        <input
          id={captionFieldId}
          name={captionName}
          placeholder="Say something about this photo…"
          disabled={disabled}
          className="w-full rounded-2xl border border-border bg-input px-4 py-3 text-sm outline-none transition-colors focus:border-primary disabled:opacity-50"
        />
      </div>
    </div>
  );
}
