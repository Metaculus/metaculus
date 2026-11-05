import {
  ChartCall,
  COVID_CALL,
  IRAN_CALL,
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
  // A call: the label shows how early the community saw it coming, and the
  // spotlight card zooms into the lead-up
  call?: ChartCall;
  // Top-left corner of the spotlight card, in chart units. The card replaces
  // the label while spotlighted, so it only has to clear the line, the hero
  // text (x < 670, y < 155) and the other labels. The top-right corner above
  // the line is free for any call.
  card?: { x: number; y: number };
  // Spotlighted on first paint
  initial?: boolean;
};

// Only events the community forecast well, so each marker doubles as
// evidence: the label says how many days ahead the forecast called it, and
// the chart cycles a spotlight through them that shows the forecast over the
// lead-up and links to the resolved question.
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
    // WHO declares a pandemic
    date: "2020-03-11",
    titleKey: "aboutChartCovid",
    side: "above",
    anchor: "middle",
    leader: 60,
    call: COVID_CALL,
    card: { x: 330, y: 186 },
  },
  {
    // Russia's full-scale invasion
    date: "2022-02-24",
    titleKey: "aboutChartUkraine",
    side: "above",
    anchor: "middle",
    leader: 60,
    call: UKRAINE_CALL,
    card: { x: 700, y: 12 },
    initial: true,
  },
  {
    // US strikes on Iran
    date: "2026-02-28",
    titleKey: "aboutChartIranStrikes",
    side: "below",
    anchor: "middle",
    dx: -10,
    leader: 96,
    call: IRAN_CALL,
    card: { x: 700, y: 12 },
  },
];
