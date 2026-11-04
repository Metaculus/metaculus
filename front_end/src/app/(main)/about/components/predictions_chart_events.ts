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
  // Shown on first paint; these must not collide with each other
  initial?: boolean;
};

// Hand-placed events. The marker's height comes from the data; only the
// label slot is fixed here. A few are shown at a time and the chart rotates
// through the rest, never showing two whose labels overlap, so a label only
// has to clear the line, the hero text above x=700 and the chart edges.
// Picking events: news anyone anywhere would recognise as big, spread across
// question categories and continents, leaning slightly to risk, and nothing
// that reads as taking a political side.
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
    month: "2017-09",
    titleKey: "aboutChartNorthKoreaTest",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2018-04",
    titleKey: "aboutChartTrumpKim",
    side: "above",
    anchor: "middle",
    leader: 60,
    initial: true,
  },
  {
    month: "2018-11",
    titleKey: "aboutChartGeneEditedBabies",
    side: "above",
    anchor: "middle",
    leader: 110,
  },
  {
    month: "2019-08",
    titleKey: "aboutChartAmazonFires",
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
    month: "2020-05",
    titleKey: "aboutChartSpacexCrew",
    side: "above",
    anchor: "middle",
    leader: 110,
  },
  {
    month: "2020-12",
    titleKey: "aboutChartCovidVaccines",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2021-08",
    titleKey: "aboutChartKabul",
    side: "above",
    anchor: "middle",
    leader: 110,
  },
  {
    month: "2022-01",
    titleKey: "aboutChartTongaEruption",
    side: "below",
    anchor: "middle",
    leader: 36,
  },
  {
    month: "2022-02",
    titleKey: "aboutChartUkraine",
    side: "above",
    anchor: "middle",
    leader: 60,
    initial: true,
  },
  {
    month: "2022-07",
    titleKey: "aboutChartJwst",
    side: "below",
    anchor: "middle",
    leader: 36,
  },
  {
    month: "2022-09",
    titleKey: "aboutChartQueenElizabeth",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2022-11",
    titleKey: "aboutChartChatGpt",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2022-12",
    titleKey: "aboutChartWorldCup",
    side: "below",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2022-12",
    titleKey: "aboutChartFusionIgnition",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2023-03",
    titleKey: "aboutChartGpt4",
    side: "above",
    anchor: "start",
    dx: -14,
    leader: 110,
  },
  {
    month: "2023-10",
    titleKey: "aboutChartIsraelHamas",
    side: "below",
    anchor: "middle",
    leader: 78,
  },
  {
    month: "2024-07",
    titleKey: "aboutChartCrowdStrike",
    side: "below",
    anchor: "middle",
    leader: 60,
  },
  {
    month: "2024-08",
    titleKey: "aboutChartMpox",
    side: "above",
    anchor: "middle",
    leader: 110,
  },
  {
    month: "2024-11",
    titleKey: "aboutChartUsElection",
    side: "above",
    anchor: "middle",
    leader: 60,
    initial: true,
  },
  {
    month: "2024-12",
    titleKey: "aboutChartBitcoin100k",
    side: "below",
    anchor: "middle",
    leader: 110,
  },
  {
    month: "2025-01",
    titleKey: "aboutChartWarming15",
    side: "above",
    anchor: "middle",
    leader: 110,
  },
  {
    month: "2025-04",
    titleKey: "aboutChartTariffs",
    side: "below",
    anchor: "middle",
    leader: 50,
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
    initial: true,
  },
];
