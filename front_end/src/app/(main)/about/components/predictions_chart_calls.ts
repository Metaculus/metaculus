// Calls: events the community forecast saw coming. Each one carries a daily
// snapshot of the community prediction on one resolved question, from the
// day the question opened through the morning of the event, on the
// question's own 0-1 scale (probability for binary questions, position on
// the axis for numeric ones). The snapshots are static because the
// questions are resolved; regenerate from /api/posts/<id>/ (recency-weighted
// aggregation history, last value of each UTC day) if a call is added.

export type CallSeries = [string, number][];

export type ChartCall = {
  postId: number;
  // Translation key for the question title
  questionKey: string;
  // "probability": binary question, the value is the forecast probability.
  // "median": numeric question, the value is the median's position on the
  // question's axis.
  kind: "probability" | "median";
  // The call holds while the forecast stays at or above this, 0-1 scale
  threshold: number;
  // The threshold in real units, for display (0.5 -> "50%", 1e6 -> "1M")
  thresholdDisplay: number;
  // Daily snapshot; the last day is the day of the event
  series: CallSeries;
};

export type LeadUp = {
  // First day of the final unbroken run at or above the threshold
  since: string;
  // Days from `since` to the event
  days: number;
  // Index of `since` in the series
  sinceIndex: number;
};

const DAY_MS = 24 * 60 * 60 * 1000;

// How early the call was: the forecast reached the threshold and stayed
// there, without dipping below, until the event. Earlier crossings that fell
// back don't count. Null when the forecast was below the threshold going in.
export function leadUp(call: ChartCall): LeadUp | null {
  const { series, threshold } = call;
  const last = series[series.length - 1];
  if (!last || last[1] < threshold) return null;
  let sinceIndex = series.length - 1;
  while (sinceIndex > 0 && (series[sinceIndex - 1]?.[1] ?? 0) >= threshold) {
    sinceIndex--;
  }
  const since = series[sinceIndex]?.[0] ?? last[0];
  const days = Math.round(
    (Date.parse(`${last[0]}T00:00:00Z`) - Date.parse(`${since}T00:00:00Z`)) /
      DAY_MS
  );
  return { since, days, sinceIndex };
}

const COVID_SERIES: CallSeries = [
  ["2020-01-27", 0.115],
  ["2020-01-28", 0.128],
  ["2020-01-29", 0.158],
  ["2020-01-30", 0.134],
  ["2020-01-31", 0.127],
  ["2020-02-01", 0.195],
  ["2020-02-02", 0.191],
  ["2020-02-03", 0.203],
  ["2020-02-04", 0.211],
  ["2020-02-05", 0.241],
  ["2020-02-06", 0.274],
  ["2020-02-07", 0.29],
  ["2020-02-08", 0.321],
  ["2020-02-09", 0.312],
  ["2020-02-10", 0.336],
  ["2020-02-11", 0.323],
  ["2020-02-12", 0.341],
  ["2020-02-13", 0.332],
  ["2020-02-14", 0.3],
  ["2020-02-15", 0.316],
  ["2020-02-16", 0.35],
  ["2020-02-17", 0.368],
  ["2020-02-18", 0.397],
  ["2020-02-19", 0.403],
  ["2020-02-20", 0.397],
  ["2020-02-21", 0.396],
  ["2020-02-22", 0.373],
  ["2020-02-23", 0.391],
  ["2020-02-24", 0.468],
  ["2020-02-25", 0.465],
  ["2020-02-26", 0.475],
  ["2020-02-27", 0.472],
  ["2020-02-28", 0.558],
  ["2020-02-29", 0.558],
  ["2020-03-01", 0.567],
  ["2020-03-02", 0.618],
  ["2020-03-03", 0.66],
  ["2020-03-04", 0.731],
  ["2020-03-05", 0.738],
  ["2020-03-06", 0.735],
  ["2020-03-07", 0.725],
  ["2020-03-08", 0.733],
  ["2020-03-09", 0.833],
  ["2020-03-10", 0.766],
  ["2020-03-11", 0.766],
];

const UKRAINE_SERIES: CallSeries = [
  ["2021-12-11", 0.58],
  ["2021-12-12", 0.2],
  ["2021-12-13", 0.31],
  ["2021-12-14", 0.33],
  ["2021-12-15", 0.33],
  ["2021-12-16", 0.3],
  ["2021-12-17", 0.33],
  ["2021-12-18", 0.28],
  ["2021-12-19", 0.35],
  ["2021-12-20", 0.37],
  ["2021-12-21", 0.3],
  ["2021-12-22", 0.41],
  ["2021-12-23", 0.39],
  ["2021-12-24", 0.4],
  ["2021-12-25", 0.43],
  ["2021-12-26", 0.45],
  ["2021-12-27", 0.43],
  ["2021-12-28", 0.45],
  ["2021-12-29", 0.4],
  ["2021-12-30", 0.4],
  ["2021-12-31", 0.38],
  ["2022-01-01", 0.32],
  ["2022-01-02", 0.32],
  ["2022-01-03", 0.32],
  ["2022-01-04", 0.31],
  ["2022-01-05", 0.3],
  ["2022-01-06", 0.3],
  ["2022-01-07", 0.3],
  ["2022-01-08", 0.27],
  ["2022-01-09", 0.28],
  ["2022-01-10", 0.3],
  ["2022-01-11", 0.32],
  ["2022-01-12", 0.32],
  ["2022-01-13", 0.3],
  ["2022-01-14", 0.37],
  ["2022-01-15", 0.5],
  ["2022-01-16", 0.5],
  ["2022-01-17", 0.5],
  ["2022-01-18", 0.44],
  ["2022-01-19", 0.58],
  ["2022-01-20", 0.52],
  ["2022-01-21", 0.52],
  ["2022-01-22", 0.5],
  ["2022-01-23", 0.5],
  ["2022-01-24", 0.53],
  ["2022-01-25", 0.52],
  ["2022-01-26", 0.56],
  ["2022-01-27", 0.55],
  ["2022-01-28", 0.5],
  ["2022-01-29", 0.44],
  ["2022-01-30", 0.44],
  ["2022-01-31", 0.45],
  ["2022-02-01", 0.49],
  ["2022-02-02", 0.5],
  ["2022-02-03", 0.46],
  ["2022-02-04", 0.45],
  ["2022-02-05", 0.45],
  ["2022-02-06", 0.5],
  ["2022-02-07", 0.5],
  ["2022-02-08", 0.46],
  ["2022-02-09", 0.45],
  ["2022-02-10", 0.44],
  ["2022-02-11", 0.45],
  ["2022-02-12", 0.65],
  ["2022-02-13", 0.6],
  ["2022-02-14", 0.67],
  ["2022-02-15", 0.5],
  ["2022-02-16", 0.56],
  ["2022-02-17", 0.7],
  ["2022-02-18", 0.67],
  ["2022-02-19", 0.75],
  ["2022-02-20", 0.75],
  ["2022-02-21", 0.88],
  ["2022-02-22", 0.89],
  ["2022-02-23", 0.9],
  ["2022-02-24", 0.9],
];

const IRAN_SERIES: CallSeries = [
  ["2026-01-21", 0.49],
  ["2026-01-22", 0.51],
  ["2026-01-23", 0.55],
  ["2026-01-24", 0.55],
  ["2026-01-25", 0.55],
  ["2026-01-26", 0.55],
  ["2026-01-27", 0.55],
  ["2026-01-28", 0.51],
  ["2026-01-29", 0.52],
  ["2026-01-30", 0.56],
  ["2026-01-31", 0.6],
  ["2026-02-01", 0.6],
  ["2026-02-02", 0.56],
  ["2026-02-03", 0.55],
  ["2026-02-04", 0.6],
  ["2026-02-05", 0.55],
  ["2026-02-06", 0.6],
  ["2026-02-07", 0.54],
  ["2026-02-08", 0.58],
  ["2026-02-09", 0.55],
  ["2026-02-10", 0.497],
  ["2026-02-11", 0.47],
  ["2026-02-12", 0.47],
  ["2026-02-13", 0.45],
  ["2026-02-14", 0.45],
  ["2026-02-15", 0.49],
  ["2026-02-16", 0.5],
  ["2026-02-17", 0.45],
  ["2026-02-18", 0.53],
  ["2026-02-19", 0.7],
  ["2026-02-20", 0.8],
  ["2026-02-21", 0.75],
  ["2026-02-22", 0.8],
  ["2026-02-23", 0.7],
  ["2026-02-24", 0.77],
  ["2026-02-25", 0.75],
  ["2026-02-26", 0.72],
  ["2026-02-27", 0.8],
  ["2026-02-28", 0.8],
];

// Placeholder: no binary question asked whether this would become a
// pandemic, so this uses the median of "How many infections before 2021?"
// passing 1 million (the axis is log-scaled, 50k to 1B, so 1M sits at
// 0.3025). Resolved above 1B. Swap for a better call if comms has one.
export const COVID_CALL: ChartCall = {
  postId: 3529,
  questionKey: "aboutChartCallQuestionCovid",
  kind: "median",
  threshold: 0.3025,
  thresholdDisplay: 1_000_000,
  series: COVID_SERIES,
};

export const UKRAINE_CALL: ChartCall = {
  postId: 8898,
  questionKey: "aboutChartCallQuestionUkraine",
  kind: "probability",
  threshold: 0.5,
  thresholdDisplay: 0.5,
  series: UKRAINE_SERIES,
};

export const IRAN_CALL: ChartCall = {
  postId: 41594,
  questionKey: "aboutChartCallQuestionIran",
  kind: "probability",
  threshold: 0.5,
  thresholdDisplay: 0.5,
  series: IRAN_SERIES,
};
