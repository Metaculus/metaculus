import { QuestionKind, WorldQuestion } from "../data/questions";

export const YEAR_MIN = 2026;
export const YEAR_MAX = 2050;
export const INITIAL_YEAR = 2030;
export const PLAY_END_YEAR = 2040;
export const YEAR_LABELS = [2026, 2028, 2030, 2032, 2035, 2040, 2045, 2050];
export const YEAR_JUMPS = [2026, 2030, 2035, 2040, 2045, 2050];
export const YEAR_STEP_KEYS: Record<string, number> = {
  ArrowLeft: -1,
  ArrowDown: -1,
  ArrowRight: 1,
  ArrowUp: 1,
  PageDown: -5,
  PageUp: 5,
};
// Density charts sample this many steps from YEAR_MIN to the end of YEAR_MAX.
export const DENSITY_STEPS = 180;
export const LIKELY_THRESHOLD = 0.5;

const DIM_BELOW_PROBABILITY = 0.2;
const T0 = 2026;
const T1 = 2051;
const SCALE_POWER = 0.66;
const MAX_GROUPS_PER_KIND = 4;
const SECONDS_PER_YEAR = 365.25 * 24 * 60 * 60;
const YEAR_MIN_TIMESTAMP = Date.UTC(YEAR_MIN, 0, 1) / 1000;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const clampYear = (year: number) =>
  Math.max(YEAR_MIN, Math.min(YEAR_MAX, year));

// Years count as equally long, which keeps each year's end within a day of
// the calendar.
export const yearToTimestamp = (year: number) =>
  YEAR_MIN_TIMESTAMP + (year - YEAR_MIN) * SECONDS_PER_YEAR;

export const timestampToYear = (timestamp: number) =>
  YEAR_MIN + (timestamp - YEAR_MIN_TIMESTAMP) / SECONDS_PER_YEAR;

// Linear interpolation through sorted breakpoints.
export const interpolate = (value: number, from: number[], to: number[]) => {
  const n = from.length;
  const first = from[0] as number;
  const last = from[n - 1] as number;
  if (value <= first) return to[0] as number;
  if (value >= last) return to[n - 1] as number;
  let lo = 0;
  let hi = n - 1;
  while (hi - lo > 1) {
    const mid = (lo + hi) >>> 1;
    if ((from[mid] as number) < value) lo = mid;
    else hi = mid;
  }
  const i = lo;
  const a = from[i] as number;
  const b = from[i + 1] as number;
  const ya = to[i] as number;
  const yb = to[i + 1] as number;
  return a === b ? ya : ya + ((yb - ya) * (value - a)) / (b - a);
};

export const probabilityByEndOf = (year: number, question: WorldQuestion) =>
  question.probabilityByYearEnd[clampYear(year) - YEAR_MIN] ?? 0;

export const isLikelyByEndOf = (year: number, question: WorldQuestion) =>
  probabilityByEndOf(year, question) >= LIKELY_THRESHOLD;

export const isDimmedIn = (year: number, question: WorldQuestion) =>
  probabilityByEndOf(year, question) < DIM_BELOW_PROBABILITY;

// Near years are stretched and far years compressed.
export const timelinePosition = (t: number) =>
  Math.pow(clamp01((t - T0) / (T1 - T0)), SCALE_POWER);

export const yearAtPosition = (fraction: number) =>
  clampYear(
    Math.floor(
      T0 + Math.pow(clamp01(fraction), 1 / SCALE_POWER) * (T1 - T0) - 0.5
    )
  );

export const yearFillPosition = (year: number) =>
  timelinePosition(Math.min(year + 1, T1));

export const linearPosition = (t: number) => clamp01((t - T0) / (T1 - T0));

export const yearAtLinearPosition = (fraction: number) =>
  clampYear(Math.floor(T0 + clamp01(fraction) * (T1 - T0) - 0.5));

export const medianDate = (median: number) =>
  new Date(Date.UTC(Math.floor(median), Math.floor((median % 1) * 12), 1));

export type MilestoneGroup = {
  kind: QuestionKind;
  milestones: WorldQuestion[];
};

// Equal-count groups along the sorted medians, with each boundary nudged to
// the widest neighbouring gap.
const groupMilestones = (
  questions: WorldQuestion[],
  kind: QuestionKind
): MilestoneGroup[] => {
  const sorted = questions
    .filter((q) => q.kind === kind)
    .sort((a, b) => a.median - b.median);
  if (!sorted.length) return [];

  const count = Math.min(
    MAX_GROUPS_PER_KIND,
    Math.max(1, Math.round(sorted.length / 3))
  );
  const size = sorted.length / count;
  const cuts: number[] = [];
  for (let c = 1; c < count; c++) {
    const ideal = Math.round(c * size);
    const prev = cuts.length ? (cuts[cuts.length - 1] as number) : 0;
    let best = ideal;
    let bestGap = -1;
    for (
      let j = Math.max(prev + 2, ideal - 1);
      j <= Math.min(sorted.length - 2, ideal + 1);
      j++
    ) {
      if (cuts.includes(j)) continue;
      const gap =
        (sorted[j] as WorldQuestion).median -
        (sorted[j - 1] as WorldQuestion).median;
      if (gap > bestGap) {
        bestGap = gap;
        best = j;
      }
    }
    if (bestGap < 0) {
      best = Math.max(prev + 2, Math.min(sorted.length - 2, ideal));
    }
    cuts.push(best);
  }

  const groups: MilestoneGroup[] = [];
  let start = 0;
  [...cuts.sort((a, b) => a - b), sorted.length].forEach((end) => {
    const milestones = sorted.slice(start, end);
    if (milestones.length) groups.push({ kind, milestones });
    start = end;
  });
  return groups;
};

export const buildMilestoneGroups = (
  questions: WorldQuestion[]
): MilestoneGroup[] => [
  ...groupMilestones(questions, "cap"),
  ...groupMilestones(questions, "use"),
];
