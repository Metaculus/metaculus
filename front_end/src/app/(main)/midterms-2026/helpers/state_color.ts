import { MIDTERMS_COLORS } from "../constants";

export type StateTier =
  | "likelyD"
  | "leanD"
  | "tossUp"
  | "leanR"
  | "likelyR"
  | "notContested";

// Toss-up is a tight 48-52% band; everything outside leans one way or the
// other. Likely is reserved for >65 / <35 (clear blowouts).
export function getStateTier(demWinPct: number | null | undefined): StateTier {
  if (demWinPct == null) return "notContested";
  if (demWinPct > 65) return "likelyD";
  if (demWinPct > 52) return "leanD";
  if (demWinPct >= 48) return "tossUp";
  if (demWinPct >= 35) return "leanR";
  return "likelyR";
}

export function getStateColor(demWinPct: number | null | undefined): string {
  return MIDTERMS_COLORS[getStateTier(demWinPct)];
}
