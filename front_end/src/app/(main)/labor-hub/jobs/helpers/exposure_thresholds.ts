import { JOBS_DATA } from "../../data";

export type ExposureLevel = "low" | "med" | "high";

type Field = "felten" | "mna" | "aoe";

function tercileBreaks(values: number[]): { mid: number; high: number } {
  const sorted = [...values].sort((a, b) => a - b);
  const lo = sorted[Math.floor((sorted.length - 1) / 3)] ?? 0;
  const hi = sorted[Math.floor((sorted.length - 1) * (2 / 3))] ?? 0;
  return { mid: lo, high: hi };
}

const BREAKS: Record<Field, { mid: number; high: number }> = {
  felten: tercileBreaks(JOBS_DATA.map((j) => j.felten)),
  mna: tercileBreaks(JOBS_DATA.map((j) => j.mna)),
  aoe: tercileBreaks(JOBS_DATA.map((j) => j.aoe)),
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
