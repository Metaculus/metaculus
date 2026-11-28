import type { Messages } from "next-intl";

import { DENSITY_STEPS, linearPosition, YEAR_MAX, YEAR_MIN } from "./forecast";
import { AreaSectionCopy } from "../data/area_sections";
import { WorldArea, WorldQuestion } from "../data/questions";

type MessageKey = keyof Messages;

const FORECAST_CARD_COUNT = 3;

const areaQuestions = (questions: WorldQuestion[], area: WorldArea) =>
  questions.filter((q) => q.area === area);

export const statementsFor = (questions: WorldQuestion[], area: WorldArea) =>
  areaQuestions(questions, area).sort((a, b) => a.median - b.median);

// The first statement that has not yet crossed 50% by the year, else the last.
export const defaultStatementIndex = (
  statements: WorldQuestion[],
  year: number
) => {
  const index = statements.findIndex(
    (q) => q.firstLikelyYear == null || q.firstLikelyYear > year
  );
  return index < 0 ? statements.length - 1 : index;
};

export type Period = { from: number; to: number; textKeys: MessageKey[] };

export const periodsFor = (
  questions: WorldQuestion[],
  area: WorldArea,
  copy: AreaSectionCopy
): Period[] => {
  const byYear = new Map<number, MessageKey[]>();
  areaQuestions(questions, area).forEach((question) => {
    const year = question.firstLikelyYear;
    const text = copy.questions[question.id];
    if (year == null || !text) return;
    const pair = question.pairId
      ? questions.find((q) => q.id === question.pairId)
      : undefined;
    const pairYear = pair ? pair.firstLikelyYear : null;
    const lagging =
      question.kind === "cap" &&
      !!pair &&
      !(pairYear != null && pairYear <= year);
    const key = lagging && text.gapKey ? text.gapKey : text.nowKey;
    byYear.set(year, [...(byYear.get(year) ?? []), key]);
  });

  const years = [...byYear.keys()].sort((a, b) => a - b);
  const periods: Period[] = [];
  const first = years[0];
  if (first != null && first > YEAR_MIN) {
    periods.push({ from: YEAR_MIN, to: first - 1, textKeys: [copy.introKey] });
  }
  years.forEach((year, i) =>
    periods.push({
      from: year,
      to: (years[i + 1] ?? YEAR_MAX + 1) - 1,
      textKeys: byYear.get(year) ?? [],
    })
  );
  return periods;
};

export const periodLabel = ({ from, to }: Period) =>
  from === to ? String(from) : `${from}–${String(to).slice(2)}`;

export const closestQuestions = (
  questions: WorldQuestion[],
  area: WorldArea,
  year: number
) =>
  areaQuestions(questions, area)
    .sort(
      (a, b) =>
        Math.abs(a.median - (year + 1)) - Math.abs(b.median - (year + 1))
    )
    .slice(0, FORECAST_CARD_COUNT);

export const LANE_START = 2026;
export const LANE_END = 2056;

// 10th and 90th percentiles of the forecast.
export const quantileBounds = (question: WorldQuestion) =>
  [question.p10, question.p90] as const;

export const percentileRange = (question: WorldQuestion) => {
  const [low, high] = quantileBounds(question);
  const from = Math.floor(low);
  const to = Math.floor(high);
  if (high > LANE_END) return `${from}–${LANE_END}+`;
  return from === to ? String(from) : `${from}–${to}`;
};

export const DENSITY_WIDTH = 350;
export const DENSITY_HEIGHT = 28;

type Point = [number, number];
const toPath = (points: Point[]) =>
  "M" + points.map(([x, y]) => `${x.toFixed(1)} ${y.toFixed(1)}`).join(" L");

const densityCache = new WeakMap<WorldQuestion, Point[]>();

const densityPoints = (question: WorldQuestion) => {
  const cached = densityCache.get(question);
  if (cached) return cached;
  const points = question.density.map((value, i): Point => {
    const year = YEAR_MIN + ((YEAR_MAX + 1 - YEAR_MIN) * i) / DENSITY_STEPS;
    return [
      linearPosition(year) * DENSITY_WIDTH,
      DENSITY_HEIGHT - 1 - value * (DENSITY_HEIGHT - 4),
    ];
  });
  densityCache.set(question, points);
  return points;
};

export const densityPaths = (question: WorldQuestion, upToX: number) => {
  const points = densityPoints(question);
  const line = toPath(points);
  const closed = (path: string, endX: number) =>
    `${path} L${endX.toFixed(1)} ${DENSITY_HEIGHT} L0 ${DENSITY_HEIGHT} Z`;
  const before = points.filter(([x]) => x <= upToX);
  const last = before[before.length - 1];
  return {
    line,
    area: closed(line, DENSITY_WIDTH),
    areaToYear: last ? closed(toPath(before), last[0]) : "",
  };
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
