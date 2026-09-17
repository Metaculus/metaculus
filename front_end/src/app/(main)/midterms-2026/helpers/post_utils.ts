import { PostWithForecasts } from "@/types/post";
import {
  QuestionType,
  QuestionWithForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { scaleInternalLocation } from "@/utils/math";

import { SenateRace } from "../data";

export type SenateRaceWithQuestion = SenateRace & {
  /** The parent group post (shared across all races), or the standalone
   *  post for races that aren't part of a group. */
  parentPost: PostWithForecasts | null;
  /** This race's specific subquestion (binary) or standalone question
   *  (multiple-choice for standalone races). */
  question: QuestionWithForecasts | null;
  /** Precomputed Democratic win probability (0–100). For standalone
   *  multiple-choice races this is `100 - P(Republican)`, so color and tooltip
   *  reflect the raw Republican win probability. Null when unavailable. */
  demWinPct: number | null;
  /** Precomputed link to the underlying question/subquestion. */
  href: string | null;
  /** Seat rating for a race with no question: "D"/"R" when the seat is safe,
   *  null when it is in play but unforecast. Always null for a race that has a
   *  question — its forecast is the rating. */
  rating: "D" | "R" | null;
};

export function getQuestionBinaryProbability(
  question: QuestionWithNumericForecasts | null
): number | null {
  if (!question) return null;
  if (question.type !== QuestionType.Binary) return null;
  const center =
    question.aggregations[question.default_aggregation_method]?.latest
      ?.centers?.[0];
  return center ?? null;
}

export function getBinaryProbability(
  post: PostWithForecasts | null
): number | null {
  if (!post?.question) return null;
  return getQuestionBinaryProbability(
    post.question as QuestionWithNumericForecasts
  );
}

/**
 * For multiple_choice questions, returns the latest aggregated probability
 * for the option matching `optionLabel` (case-insensitive). Returns null if
 * the post isn't multiple_choice or the option isn't found.
 */
export function getMultipleChoiceOptionProbability(
  post: PostWithForecasts | null,
  optionLabel: string
): number | null {
  if (!post?.question) return null;
  const q = post.question;
  if (q.type !== QuestionType.MultipleChoice) return null;
  const options = q.options ?? [];
  const idx = options.findIndex(
    (opt) => opt.toLowerCase() === optionLabel.toLowerCase()
  );
  if (idx < 0) return null;
  const aggs = (q as unknown as QuestionWithNumericForecasts).aggregations;
  const center = aggs?.[q.default_aggregation_method]?.latest?.centers?.[idx];
  return center ?? null;
}

export function getNumericForecast(
  post: PostWithForecasts | null
): number | null {
  if (!post?.question) return null;
  const question = post.question as QuestionWithNumericForecasts;
  const center =
    question.aggregations[question.default_aggregation_method]?.latest
      ?.centers?.[0];
  if (center == null) return null;
  return scaleInternalLocation(center, question.scaling);
}

export function getForecastersCount(post: PostWithForecasts | null): number {
  if (!post) return 0;
  return post.nr_forecasters ?? post.forecasts_count ?? 0;
}

export function getCommentsCount(post: PostWithForecasts | null): number {
  if (!post) return 0;
  return post.comment_count ?? 0;
}

export function getDemWinPct(
  question: QuestionWithNumericForecasts | null
): number | null {
  const prob = getQuestionBinaryProbability(question);
  if (prob == null) return null;
  return Math.round(prob * 100);
}

/** Half-width of the toss-up band, in points either side of 50. */
const CLOSE_RACE_MARGIN = 10;

/**
 * Counts races by favored side, plus how many are close enough to be in play.
 * The `>= 50` split matches the one `state_tooltip.tsx` uses, so a summary can
 * never disagree with a tooltip. Null when the ballot is empty.
 *
 * A safe seat counts for its party without a forecast — that is the point of
 * rating it — so the denominator is every race on the ballot, not only the ones
 * carrying a question. `unrated` is the remainder: on the ballot, no question,
 * too competitive to call. Those count toward `total` and toward neither side,
 * so `dem + rep` deliberately falls short of `total`.
 *
 * `close` deliberately overlaps `dem` and `rep` rather than partitioning them: a
 * toss-up still leans one way, and pulling it out of its side's count would make
 * the two figures contradict each other when read in one sentence.
 */
export function summarizeRaceLeans(races: SenateRaceWithQuestion[]): {
  dem: number;
  rep: number;
  close: number;
  unrated: number;
  total: number;
} | null {
  let dem = 0;
  let rep = 0;
  let close = 0;
  let unrated = 0;
  for (const race of races) {
    if (race.rating === "D") {
      dem += 1;
      continue;
    }
    if (race.rating === "R") {
      rep += 1;
      continue;
    }
    if (race.demWinPct == null) {
      unrated += 1;
      continue;
    }
    if (race.demWinPct >= 50) dem += 1;
    else rep += 1;
    if (Math.abs(race.demWinPct - 50) <= CLOSE_RACE_MARGIN) close += 1;
  }
  const total = dem + rep + unrated;
  return total > 0 ? { dem, rep, close, unrated, total } : null;
}
