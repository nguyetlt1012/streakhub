import { PROOF_MODE_OPTIONS, type ProofMode } from "@/lib/streaks/constants";

const VALID_PROOF_MODES = new Set<string>(
  PROOF_MODE_OPTIONS.map((option) => option.value),
);

export function normalizeProofModes(modes: ProofMode[]): ProofMode[] {
  const unique = [...new Set(modes.filter((mode) => VALID_PROOF_MODES.has(mode)))];
  return unique.length > 0 ? unique : ["none"];
}

export function getStreakProofModes(
  streak: { proofModes?: ProofMode[] | null },
): ProofMode[] {
  return normalizeProofModes(streak.proofModes ?? ["none"]);
}

export function streakAllowsProof(
  streak: { proofModes?: ProofMode[] | null },
  mode: ProofMode,
): boolean {
  return getStreakProofModes(streak).includes(mode);
}

export function parseProofModesFromFormData(formData: FormData): {
  modes: ProofMode[] | null;
  error?: string;
} {
  const raw = formData.getAll("proofModes");
  if (raw.length === 0) {
    return { modes: null, error: "Select at least one proof option." };
  }

  const modes: ProofMode[] = [];
  for (const entry of raw) {
    if (typeof entry !== "string" || !VALID_PROOF_MODES.has(entry)) {
      return { modes: null, error: "Invalid proof option." };
    }
    modes.push(entry as ProofMode);
  }

  return { modes: normalizeProofModes(modes) };
}

export function parseCheckInProofMode(
  formData: FormData,
  allowed: ProofMode[],
): { mode: ProofMode | null; error?: string } {
  const raw = formData.get("proofMode");
  if (typeof raw !== "string" || !VALID_PROOF_MODES.has(raw)) {
    return { mode: null, error: "Choose how to prove today." };
  }

  const mode = raw as ProofMode;
  if (!allowed.includes(mode)) {
    return {
      mode: null,
      error: "That proof method is not allowed for this protocol.",
    };
  }

  return { mode };
}

export function formatProofModesLabel(modes: ProofMode[]): string {
  return getStreakProofModes({ proofModes: modes })
    .map(
      (mode) =>
        PROOF_MODE_OPTIONS.find((option) => option.value === mode)?.label ??
        mode,
    )
    .join(" · ");
}

export function canQuickCheckIn(modes: ProofMode[]): boolean {
  return getStreakProofModes({ proofModes: modes }).includes("none");
}

export function requiresCheckInPage(modes: ProofMode[]): boolean {
  const allowed = getStreakProofModes({ proofModes: modes });
  if (allowed.length === 1) {
    return allowed[0] !== "none";
  }
  return allowed.length > 1;
}

export function isTaskOnlyProof(modes: ProofMode[]): boolean {
  const allowed = getStreakProofModes({ proofModes: modes });
  return allowed.length === 1 && allowed[0] === "task";
}

export function getOrderedCheckInProofOptions(modes: ProofMode[]): ProofMode[] {
  const allowed = new Set(getStreakProofModes({ proofModes: modes }));
  return PROOF_MODE_OPTIONS.map((option) => option.value).filter((mode) =>
    allowed.has(mode),
  );
}

export function getProofModeOptionLabel(mode: ProofMode): string {
  return (
    PROOF_MODE_OPTIONS.find((option) => option.value === mode)?.label ?? mode
  );
}
