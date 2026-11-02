export type ChartEvent = {
  // First day of the month the marker sits on, "YYYY-MM"
  month: string;
  // Translation key; "\n" in the translated string splits lines
  titleKey: string;
  // Show only the year under the title instead of month + year
  yearOnly?: boolean;
  // Label placement relative to the marker
  side: "above" | "below";
  anchor: "start" | "middle" | "end";
  // Horizontal label offset from the marker, in chart units
  dx?: number;
  // Length of the dashed leader between marker and label
  leader: number;
  // The founding marker uses a lighter style and no leader
  origin?: boolean;
};

// Hand-placed events. The marker's height comes from the data; only the
// label slot is fixed here. Keep labels from colliding when adding one.
export const CHART_EVENTS: ChartEvent[] = [
  {
    month: "2015-11",
    titleKey: "aboutChartFounded",
    yearOnly: true,
    side: "above",
    anchor: "start",
    dx: 12,
    leader: 0,
    origin: true,
  },
  {
    month: "2018-04",
    titleKey: "aboutChartTrumpKim",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2020-03",
    titleKey: "aboutChartCovid",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2022-02",
    titleKey: "aboutChartUkraine",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2023-10",
    titleKey: "aboutChartIsraelHamas",
    side: "below",
    anchor: "middle",
    leader: 78,
  },
  {
    month: "2024-11",
    titleKey: "aboutChartUsElection",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2026-02",
    titleKey: "aboutChartIranStrikes",
    side: "below",
    anchor: "middle",
    dx: -10,
    leader: 96,
  },
  {
    month: "2026-07",
    titleKey: "aboutChartHuggingFace",
    side: "above",
    anchor: "end",
    dx: -16,
    leader: 36,
  },
];
