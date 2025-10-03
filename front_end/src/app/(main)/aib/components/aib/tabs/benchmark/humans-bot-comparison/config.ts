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
  { x: "2024 Q3", baseline: 12.9, pros: 14.0, bots: 10.8 },
  { x: "2024 Q4", baseline: 13.2, pros: 14.4, bots: 10.6 },
  { x: "2025 Q1", baseline: 13.5, pros: 14.7, bots: 10.7 },
  { x: "2025 Q2", baseline: 13.6, pros: 14.8, bots: 10.9 },
];

export function deriveStats(data: BenchmarkPoint[]) {
  const maxBy = <K extends Extract<SeriesKey, "pros" | "bots">>(key: K) =>
    data.reduce(
      (best, p) => (!best || p[key] > best[key] ? p : best),
      null as BenchmarkPoint | null
    );

  const prosPeak = maxBy("pros");
  const botsPeak = maxBy("bots");

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
      value: "0",
      label: "Baseline Reference",
      subLabel: "(Sonnet 3.7)",
    },
  ];
}
