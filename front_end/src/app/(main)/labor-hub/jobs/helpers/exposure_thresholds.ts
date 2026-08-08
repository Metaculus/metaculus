import { JOBS_DATA } from "../../data";

export type ExposureLevel = "low" | "med" | "high";

type Field = "felten" | "mna" | "aoe";

// Fixed, scale-meaningful tier cutoffs (not data terciles), per editorial review:
// felten — standardized z-score: within ±1σ of the average occupation = MED;
// mna — 0–1 vulnerability score: 0.2 / 0.3; aoe — observed exposure %: 10 / 20.
const BREAKS: Record<Field, { mid: number; high: number }> = {
  felten: { mid: -1, high: 1 },
  mna: { mid: 0.2, high: 0.3 },
  aoe: { mid: 10, high: 20 },
};

/** Min/max per metric (for normalized progress-bar widths). */
export const RANGES: Record<Field, { min: number; max: number }> = {
  felten: range(JOBS_DATA.map((j) => j.felten)),
  mna: range(JOBS_DATA.map((j) => j.mna)),
  aoe: range(JOBS_DATA.map((j) => j.aoe)),
};

function range(values: number[]): { min: number; max: number } {
  return {
    min: Math.min(...values),
    max: Math.max(...values),
  };
}

export function getExposureLevel(field: Field, value: number): ExposureLevel {
  const { mid, high } = BREAKS[field];
  if (value > high) return "high";
  if (value > mid) return "med";
  return "low";
}

export function normalize(field: Field, value: number): number {
  const { min, max } = RANGES[field];
  if (max === min) return 0.5;
  const v = (value - min) / (max - min);
  return Math.max(0, Math.min(1, v));
}
