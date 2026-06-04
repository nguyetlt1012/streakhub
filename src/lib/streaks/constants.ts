import {
  BookOpen,
  Brain,
  Calculator,
  Code2,
  Dumbbell,
  FlaskConical,
  Languages,
  Music,
  Palette,
  PenLine,
  type LucideIcon,
} from "lucide-react";
export type ProofMode = "task" | "photo" | "text" | "none";

export type StreakIconPreset = {
  id: string;
  label: string;
  Icon: LucideIcon;
};

export const STREAK_ICON_PRESETS: StreakIconPreset[] = [
  { id: "languages", label: "Language", Icon: Languages },
  { id: "book-open", label: "Reading", Icon: BookOpen },
  { id: "code-2", label: "Code", Icon: Code2 },
  { id: "calculator", label: "Math", Icon: Calculator },
  { id: "dumbbell", label: "Fitness", Icon: Dumbbell },
  { id: "brain", label: "Learning", Icon: Brain },
  { id: "pen-line", label: "Writing", Icon: PenLine },
  { id: "flask-conical", label: "Science", Icon: FlaskConical },
  { id: "music", label: "Music", Icon: Music },
  { id: "palette", label: "Art", Icon: Palette },
];

export const ICON_PRESET_MAP = Object.fromEntries(
  STREAK_ICON_PRESETS.map((preset) => [preset.id, preset]),
) as Record<string, StreakIconPreset>;

export type ProofModeOption = {
  value: ProofMode;
  label: string;
  description: string;
  suggestedFor: string[];
};

export const PROOF_MODE_OPTIONS: ProofModeOption[] = [
  {
    value: "none",
    label: "One tap",
    description: "Mark done with a single button — no extra proof.",
    suggestedFor: ["Habits", "Simple routines"],
  },
  {
    value: "task",
    label: "Task",
    description: "Complete a linked task to check in for the day.",
    suggestedFor: ["To-do habits", "Study blocks"],
  },
  {
    value: "text",
    label: "Text",
    description: "Write a short note (minimum length applies).",
    suggestedFor: ["Journaling", "Reflection"],
  },
  {
    value: "photo",
    label: "Photo",
    description: "Upload a photo with an optional caption.",
    suggestedFor: ["Workout", "Progress shots"],
  },
];

/** Common IANA timezones for the wizard picker */
export const COMMON_TIMEZONES = [
  "UTC",
  "America/New_York",
  "America/Chicago",
  "America/Denver",
  "America/Los_Angeles",
  "Europe/London",
  "Europe/Paris",
  "Europe/Berlin",
  "Asia/Dubai",
  "Asia/Kolkata",
  "Asia/Bangkok",
  "Asia/Ho_Chi_Minh",
  "Asia/Singapore",
  "Asia/Tokyo",
  "Asia/Seoul",
  "Australia/Sydney",
] as const;

export const DEFAULT_TEXT_MIN_LENGTH = 15;
export const MAX_AVATAR_BYTES = 2 * 1024 * 1024;
export const ALLOWED_AVATAR_TYPES = [
  "image/jpeg",
  "image/png",
  "image/webp",
] as const;
