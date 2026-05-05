import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { scaleInternalLocation } from "@/utils/math";

import { SenateRace } from "../data";

export type SenateRaceWithPost = SenateRace & {
  post: PostWithForecasts | null;
};

export function getBinaryProbability(
  post: PostWithForecasts | null
): number | null {
  if (!post?.question) return null;
  const q = post.question as QuestionWithNumericForecasts;
  if (q.type !== QuestionType.Binary) return null;
  const center =
    q.aggregations[q.default_aggregation_method]?.latest?.centers?.[0];
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
  return post.forecasts_count ?? 0;
}

export function getCommentsCount(post: PostWithForecasts | null): number {
  if (!post) return 0;
  return post.comment_count ?? 0;
}

export function getDemWinPct(post: PostWithForecasts | null): number | null {
  if (!post) return null;
  const prob = getBinaryProbability(post);
  if (prob == null) return null;
  return Math.round(prob * 100);
}

export function getLatestUpdateTime(
  posts: (PostWithForecasts | null)[]
): Date | null {
  let latest: Date | null = null;
  for (const post of posts) {
    if (!post?.question) continue;
    const q = post.question as QuestionWithNumericForecasts;
    const startTime =
      q.aggregations[q.default_aggregation_method]?.latest?.start_time;
    if (!startTime) continue;
    const d = new Date(startTime);
    if (!latest || d > latest) latest = d;
  }
  return latest;
}
