import { MIDTERMS_COLORS } from "../constants";

export type StateTier =
  | "likelyD"
  | "leanD"
  | "tossUp"
  | "leanR"
  | "likelyR"
  | "notContested";

export function getStateTier(demWinPct: number | null | undefined): StateTier {
  if (demWinPct == null) return "notContested";
  if (demWinPct > 70) return "likelyD";
  if (demWinPct >= 55) return "leanD";
  if (demWinPct >= 45) return "tossUp";
  if (demWinPct >= 30) return "leanR";
  return "likelyR";
}

export function getStateColor(demWinPct: number | null | undefined): string {
  return MIDTERMS_COLORS[getStateTier(demWinPct)];
}

export const STATE_TIER_LABEL_KEY: Record<StateTier, string> = {
  likelyD: "midtermsHubTierLikelyD",
  leanD: "midtermsHubTierLeanD",
  tossUp: "midtermsHubTierTossUp",
  leanR: "midtermsHubTierLeanR",
  likelyR: "midtermsHubTierLikelyR",
  notContested: "midtermsHubTierNotContested",
};
