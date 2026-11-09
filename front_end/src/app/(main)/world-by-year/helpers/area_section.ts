import { firstLikelyYear, quantile } from "./forecast";
import { WORLD_QUESTIONS, WorldArea, WorldQuestion } from "../data/questions";

const areaQuestions = (area: WorldArea) =>
  WORLD_QUESTIONS.filter((q) => q.area === area);

export const statementsFor = (area: WorldArea) =>
  [...areaQuestions(area)].sort((a, b) => a.median - b.median);

// The first statement that has not yet crossed 50% by the year, else the last.
export const defaultStatementIndex = (
  statements: WorldQuestion[],
  year: number
) => {
  const index = statements.findIndex((q) => {
    const crossed = firstLikelyYear(q);
    return crossed == null || crossed > year;
  });
  return index < 0 ? statements.length - 1 : index;
};

export const LANE_START = 2026;
export const LANE_END = 2056;

// 10th and 90th percentiles of the forecast.
export const quantileBounds = (question: WorldQuestion) =>
  [quantile(question, 0.1), quantile(question, 0.9)] as const;

export const percentileRange = (question: WorldQuestion) => {
  const [low, high] = quantileBounds(question);
  const from = Math.floor(low);
  const to = Math.floor(high);
  if (high > LANE_END) return `${from}–${LANE_END}+`;
  return from === to ? String(from) : `${from}–${to}`;
};

export type LaneGeometry = {
  pxPerYear: number;
  padLeft: number;
  padRight: number;
  rowHeight: number;
  header: number;
  axis: number;
};

export const laneGeometry = (compact: boolean): LaneGeometry => ({
  pxPerYear: compact ? 34 : 46,
  padLeft: compact ? 18 : 26,
  padRight: compact ? 34 : 40,
  rowHeight: compact ? 42 : 46,
  header: 6,
  axis: 48,
});

export const laneX = (g: LaneGeometry, t: number) =>
  g.padLeft +
  (Math.max(LANE_START, Math.min(LANE_END, t)) - LANE_START) * g.pxPerYear;

export const laneWidth = (g: LaneGeometry) =>
  Math.round(g.padLeft + (LANE_END - LANE_START) * g.pxPerYear + g.padRight);

// Vertical centre of lane j inside the lanes SVG.
export const laneCenter = (g: LaneGeometry, j: number) =>
  8 + j * g.rowHeight + 26;

export const todayAsYear = () => {
  const now = new Date();
  const year = now.getFullYear();
  const start = new Date(year, 0, 1).getTime();
  const end = new Date(year + 1, 0, 1).getTime();
  return Math.max(LANE_START, year + (now.getTime() - start) / (end - start));
};
