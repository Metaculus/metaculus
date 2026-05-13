export const CHART_DASH = {
  grid: "3 2",
  cursor: "5 2",
  quartile: "2 2",
  threshold: "2 2",
  timelineMarker: "4 3",
} as const;

export type ChartDashKey = keyof typeof CHART_DASH;
