import { METAC_COLORS } from "@/constants/colors";
import { ThemeColor } from "@/types/theme";

export type BenchmarkPoint = {
  x: string;
  baseline: number;
  pros: number;
  bots: number;
};
export type AIBTheme = "red" | "green" | "blue";

export const AIB_THEME: Record<
  AIBTheme,
  {
    bgClass: string;
    textClass: string;
    token: ThemeColor;
  }
> = {
  red: {
    bgClass: "bg-mc-option-2 dark:bg-mc-option-2-dark",
    textClass: "text-mc-option-2 dark:text-mc-option-2-dark",
    token: METAC_COLORS["mc-option"][2],
  },
  green: {
    bgClass: "bg-mc-option-3 dark:bg-mc-option-3-dark",
    textClass: "text-mc-option-3 dark:text-mc-option-3-dark",
    token: METAC_COLORS["mc-option"][3],
  },
  blue: {
    bgClass: "bg-mc-option-1 dark:bg-mc-option-1-dark",
    textClass: "text-mc-option-1 dark:text-mc-option-1-dark",
    token: METAC_COLORS["mc-option"][1],
  },
};

export const SERIES_META = {
  baseline: { label: "Baseline (Sonnet 3.7)", theme: "blue" as AIBTheme },
  pros: { label: "Pro Forecasters", theme: "red" as AIBTheme },
  bots: { label: "Bots", theme: "green" as AIBTheme },
} as const;

export type SeriesKey = keyof typeof SERIES_META;

export const points: BenchmarkPoint[] = [
  { x: "2024 Q3", baseline: 12.9, pros: 8.33, bots: 0.97 },
  { x: "2024 Q4", baseline: 13.2, pros: 16.13, bots: 8.35 },
  { x: "2025 Q1", baseline: 13.5, pros: 27.299, bots: 9.636 },
  { x: "2025 Q2", baseline: 13.6, pros: 38.974, bots: 19.561 },
];

export function deriveStats(data: BenchmarkPoint[]) {
  const maxBy = <K extends Extract<SeriesKey, "pros" | "bots">>(key: K) =>
    data.reduce(
      (best, p) => (!best || p[key] > (best as BenchmarkPoint)[key] ? p : best),
      null as BenchmarkPoint | null
    );

  const prosPeak = maxBy("pros");
  const botsPeak = maxBy("bots");
  const latest = data[data.length - 1];
  const baselineValue = latest?.baseline ?? 0;

  return [
    {
      key: "pros" as const,
      theme: SERIES_META.pros.theme,
      value: prosPeak?.pros.toFixed(1) ?? "0",
      label: "Peak Pro Performance",
      subLabel: `(${prosPeak?.x})`,
    },
    {
      key: "bots" as const,
      theme: SERIES_META.bots.theme,
      value: botsPeak?.bots.toFixed(1) ?? "0",
      label: "Peak Bot Performance",
      subLabel: `(${botsPeak?.x})`,
    },
    {
      key: "baseline" as const,
      theme: SERIES_META.baseline.theme,
      value: baselineValue.toFixed(1),
      label: "Baseline Reference",
      subLabel: "(Sonnet 3.7)",
    },
  ];
}
