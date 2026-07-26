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
