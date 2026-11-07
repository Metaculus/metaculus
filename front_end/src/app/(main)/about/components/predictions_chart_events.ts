import {
  ChartCall,
  COUNTEROFFENSIVE_CALL,
  IRAN_CALL,
  KYIV_CALL,
  NO_RECESSION_CALL,
  OMICRON_CALL,
  ROE_CALL,
  TOKYO_GOES_AHEAD_CALL,
  TOKYO_POSTPONED_CALL,
  TRUMP_KIM_CALL,
  UKRAINE_CALL,
} from "./predictions_chart_calls";

export type ChartEvent = {
  // Day the marker sits on, "YYYY-MM-DD"
  date: string;
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
  // A call: the label says how many days ahead the community forecast saw
  // it, a band shades the lead-up, and the spotlight card below the chart
  // shows the forecast, the source it beat and a link to the question
  call?: ChartCall;
  // Something that did not happen (a recession, a breakthrough) that many
  // expected; drawn with a hollow marker
  nonEvent?: boolean;
};

// Hand-placed events. The marker's height comes from the data; only the
// label slot is fixed here. A few are shown at a time and the chart rotates
// through the rest, never showing two whose labels overlap, so a label only
// has to clear the line, the hero text above x=700 and the chart edges.
// Calls come up more often than plain news.
// Picking news: events anyone anywhere would recognise as big, spread across
// question categories and continents, leaning slightly to risk, and nothing
// that reads as taking a political side.
// Picking calls: a resolved question with a large crowd whose forecast moved
// to the right side well ahead of the event, ideally while a named outside
// source (market, agency, expert survey, polls) was on the other side.
export const CHART_EVENTS: ChartEvent[] = [
  {
    date: "2015-11-01",
    titleKey: "aboutChartFounded",
    yearOnly: true,
    side: "above",
    anchor: "start",
    dx: 12,
    leader: 0,
    origin: true,
  },
  {
    date: "2017-09-01",
    titleKey: "aboutChartNorthKoreaTest",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    date: "2018-11-01",
    titleKey: "aboutChartGeneEditedBabies",
    side: "above",
    anchor: "middle",
    leader: 110,
  },
  {
    date: "2019-08-01",
    titleKey: "aboutChartAmazonFires",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    date: "2020-03-01",
    titleKey: "aboutChartCovid",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    date: "2020-05-01",
    titleKey: "aboutChartSpacexCrew",
    side: "above",
    anchor: "middle",
    leader: 110,
  },
  {
    date: "2020-12-01",
    titleKey: "aboutChartCovidVaccines",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    date: "2021-08-01",
    titleKey: "aboutChartKabul",
    side: "above",
    anchor: "middle",
    leader: 110,
  },
  {
    date: "2022-01-01",
    titleKey: "aboutChartTongaEruption",
    side: "below",
    anchor: "middle",
    leader: 36,
  },
  {
    date: "2022-07-01",
    titleKey: "aboutChartJwst",
    side: "below",
    anchor: "middle",
    leader: 36,
  },
  {
    date: "2022-09-01",
    titleKey: "aboutChartQueenElizabeth",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    date: "2022-11-01",
    titleKey: "aboutChartChatGpt",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    date: "2022-12-01",
    titleKey: "aboutChartWorldCup",
    side: "below",
    anchor: "middle",
    leader: 60,
  },
  {
    date: "2022-12-01",
    titleKey: "aboutChartFusionIgnition",
    side: "above",
    anchor: "middle",
    leader: 60,
  },
  {
    date: "2023-03-01",
    titleKey: "aboutChartGpt4",
    side: "above",
    anchor: "start",
    dx: -14,
    leader: 110,
  },
  {
    date: "2023-10-01",
    titleKey: "aboutChartIsraelHamas",
    side: "below",
    anchor: "middle",
    leader: 78,
  },
  {
    date: "2024-07-01",
    titleKey: "aboutChartCrowdStrike",
    side: "below",
    anchor: "middle",
    leader: 60,
  },
  {
    date: "2024-08-01",
    titleKey: "aboutChartMpox",
    side: "above",
    anchor: "middle",
    leader: 110,
  },
  {
    date: "2024-11-01",
    titleKey: "aboutChartUsElection",
    side: "above",
    anchor: "middle",
    leader: 60,
    initial: true,
  },
  {
    date: "2024-12-01",
    titleKey: "aboutChartBitcoin100k",
    side: "below",
    anchor: "middle",
    leader: 110,
  },
  {
    date: "2025-01-01",
    titleKey: "aboutChartWarming15",
    side: "above",
    anchor: "middle",
    leader: 110,
  },
  {
    date: "2025-04-01",
    titleKey: "aboutChartTariffs",
    side: "below",
    anchor: "middle",
    leader: 50,
  },
  {
    date: "2026-07-01",
    titleKey: "aboutChartHuggingFace",
    side: "above",
    anchor: "end",
    dx: -16,
    leader: 36,
    initial: true,
  },
  {
    date: "2018-06-12",
    titleKey: "aboutChartTrumpKim",
    side: "above",
    anchor: "middle",
    leader: 60,
    call: TRUMP_KIM_CALL,
  },
  {
    date: "2020-03-24",
    titleKey: "aboutChartTokyoPostponed",
    side: "above",
    anchor: "middle",
    leader: 125,
    call: TOKYO_POSTPONED_CALL,
  },
  {
    date: "2021-07-23",
    titleKey: "aboutChartTokyoGoesAhead",
    side: "above",
    anchor: "middle",
    leader: 100,
    call: TOKYO_GOES_AHEAD_CALL,
  },
  {
    // WHO first says Omicron "does appear to be less severe"
    date: "2022-01-06",
    titleKey: "aboutChartOmicronMilder",
    side: "below",
    anchor: "middle",
    leader: 24,
    call: OMICRON_CALL,
  },
  {
    date: "2022-02-24",
    titleKey: "aboutChartUkraine",
    side: "above",
    anchor: "middle",
    leader: 60,
    call: UKRAINE_CALL,
    initial: true,
  },
  {
    // Russia completes its withdrawal from the Kyiv region
    date: "2022-04-02",
    titleKey: "aboutChartKyivHolds",
    side: "above",
    anchor: "middle",
    leader: 88,
    call: KYIV_CALL,
  },
  {
    date: "2022-06-24",
    titleKey: "aboutChartRoe",
    side: "above",
    anchor: "middle",
    leader: 78,
    call: ROE_CALL,
  },
  {
    // End of the window most economists expected a recession in
    date: "2023-07-01",
    titleKey: "aboutChartNoRecession",
    side: "below",
    anchor: "middle",
    leader: 36,
    call: NO_RECESSION_CALL,
    nonEvent: true,
  },
  {
    // US intelligence reported to expect the counteroffensive to fall short
    date: "2023-08-17",
    titleKey: "aboutChartCounteroffensive",
    side: "above",
    anchor: "middle",
    leader: 60,
    call: COUNTEROFFENSIVE_CALL,
    nonEvent: true,
  },
  {
    date: "2026-02-28",
    titleKey: "aboutChartIranStrikes",
    side: "below",
    anchor: "middle",
    dx: -10,
    leader: 96,
    call: IRAN_CALL,
  },
];
