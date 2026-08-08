import { getColorInSpectrum, parseHexColor } from "@/utils/core/colors";

import { MIDTERMS_COLORS } from "../constants";

const RED_RGB = parseHexColor(MIDTERMS_COLORS.spectrumRep) ?? [
  0xd4, 0x50, 0x4a,
];
const NEUTRAL_RGB = parseHexColor(MIDTERMS_COLORS.spectrumNeutral) ?? [
  0xd3, 0xd1, 0xc7,
];
const BLUE_RGB = parseHexColor(MIDTERMS_COLORS.spectrumDem) ?? [
  0x4a, 0x5c, 0xd4,
];

/**
 * Returns a continuous color along a Republican → neutral → Democrat gradient
 * given the Democrat win probability (0-100). Smooth interpolation produces
 * perceptible differences between adjacent forecasts (e.g. 37% vs 45%) which
 * a tier-based bucketing cannot.
 */
export function getStateColor(demWinPct: number | null | undefined): string {
  if (demWinPct == null) return MIDTERMS_COLORS.uncontestedLight;
  const value = Math.max(0, Math.min(1, demWinPct / 100));
  return getColorInSpectrum(RED_RGB, NEUTRAL_RGB, BLUE_RGB, value);
}
