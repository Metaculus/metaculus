import { clampYear, YEAR_MAX } from "./forecast";
import { WorldQuestion } from "../data/questions";

const CHART_START = 2026;
const CHART_END = 2051;

// The middle 50% of forecasts, e.g. "2029–34" or "2041–2050+".
export const quartileRange = (question: WorldQuestion) => {
  const from = Math.floor(question.p25);
  const to = Math.floor(question.p75);
  if (from >= YEAR_MAX) return `${YEAR_MAX}+`;
  if (to > YEAR_MAX) return `${from}–${YEAR_MAX}+`;
  return from === to ? String(from) : `${from}–${String(to).slice(2)}`;
};

// The year under the pointer. Its line is drawn at the end of the year, so the
// handle can sit up to a year to the right of the pointer.
export const yearAtChartFraction = (fraction: number) =>
  clampYear(Math.ceil(CHART_START + fraction * (CHART_END - CHART_START)) - 1);
