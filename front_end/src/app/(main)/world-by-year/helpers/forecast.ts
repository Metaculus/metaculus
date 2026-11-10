import {
  QuestionKind,
  WORLD_QUESTIONS,
  WorldQuestion,
} from "../data/questions";

export const YEAR_MIN = 2026;
export const YEAR_MAX = 2050;
export const INITIAL_YEAR = 2030;
export const PLAY_END_YEAR = 2040;
export const YEAR_LABELS = [2026, 2028, 2030, 2032, 2035, 2040, 2045, 2050];
export const YEAR_JUMPS = [2026, 2030, 2035, 2040, 2045, 2050];

const LIKELY_THRESHOLD = 0.5;
const DIM_BELOW_PROBABILITY = 0.2;
const T0 = 2026;
const T1 = 2051;
const BASE = 2026.5;
const SCALE_POWER = 0.66;
const MAX_GROUPS_PER_KIND = 4;

const clamp01 = (v: number) => Math.max(0, Math.min(1, v));

export const clampYear = (year: number) =>
  Math.max(YEAR_MIN, Math.min(YEAR_MAX, year));

const erf = (value: number) => {
  const sign = Math.sign(value);
  const x = Math.abs(value);
  const t = 1 / (1 + 0.3275911 * x);
  return (
    sign *
    (1 -
      ((((1.061405429 * t - 1.453152027) * t + 1.421413741) * t - 0.284496736) *
        t +
        0.254829592) *
        t *
        Math.exp(-x * x))
  );
};

export const probabilityBy = (t: number, question: WorldQuestion) => {
  const x = t - BASE;
  if (x <= 0) return 0;
  return (
    0.5 *
    (1 +
      erf(
        (Math.log(x) - Math.log(question.median - BASE)) /
          question.spread /
          Math.SQRT2
      ))
  );
};

export const densityAt = (t: number, question: WorldQuestion) => {
  const x = t - BASE;
  if (x <= 0) return 0;
  const mu = Math.log(question.median - BASE);
  return (
    Math.exp(-((Math.log(x) - mu) ** 2) / (2 * question.spread ** 2)) /
    (x * question.spread)
  );
};

export const quantile = (question: WorldQuestion, p: number) => {
  let lo = BASE;
  let hi = T1 + 40;
  for (let i = 0; i < 40; i++) {
    const mid = (lo + hi) / 2;
    if (probabilityBy(mid, question) < p) lo = mid;
    else hi = mid;
  }
  return (lo + hi) / 2;
};

export const isLikelyByEndOf = (year: number, question: WorldQuestion) =>
  probabilityBy(year + 1, question) >= LIKELY_THRESHOLD;

export const isDimmedIn = (year: number, question: WorldQuestion) =>
  probabilityBy(year + 1, question) < DIM_BELOW_PROBABILITY;

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

export const firstLikelyYear = (question: WorldQuestion) => {
  for (let year = YEAR_MIN; year <= YEAR_MAX; year++) {
    if (isLikelyByEndOf(year, question)) return year;
  }
  return null;
};

export const medianDate = (median: number) =>
  new Date(Date.UTC(Math.floor(median), Math.floor((median % 1) * 12), 1));

export type MilestoneGroup = {
  kind: QuestionKind;
  milestones: WorldQuestion[];
};

// Equal-count groups along the sorted medians, with each boundary nudged to
// the widest neighbouring gap.
const groupMilestones = (kind: QuestionKind): MilestoneGroup[] => {
  const sorted = WORLD_QUESTIONS.filter((q) => q.kind === kind).sort(
    (a, b) => a.median - b.median
  );
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

export const MILESTONE_GROUPS: MilestoneGroup[] = [
  ...groupMilestones("cap"),
  ...groupMilestones("use"),
];
