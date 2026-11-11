import "server-only";

import ServerAggregationsExplorerApi from "@/services/api/aggregation_explorer/aggregation_explorer.server";
import { PostWithForecasts } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";

import { getContinuousQuestions, readCdfAt } from "./forecast_values";
import { GHM_ARCHIVE_REVALIDATE_SECONDS } from "../config/season";

async function fetchCdfAt(
  question: QuestionWithForecasts,
  asOf: number
): Promise<number[] | null> {
  try {
    const explored = await ServerAggregationsExplorerApi.getAggregations(
      {
        questionId: question.id,
        aggregationMethods: question.default_aggregation_method,
        includeBots: question.include_bots_in_aggregates,
      },
      { next: { revalidate: GHM_ARCHIVE_REVALIDATE_SECONDS } }
    );
    return readCdfAt(explored as unknown as QuestionWithForecasts, asOf);
  } catch (error) {
    logError(error);
    return null;
  }
}

/**
 * Community Prediction distributions of the posts' numeric, discrete and date questions as of
 * `asOf` (seconds), keyed by question ID. Past editions draw their curves from these.
 */
export async function fetchGhmDistributionsAt(
  posts: PostWithForecasts[],
  asOf: number
): Promise<Record<number, number[]>> {
  const questions = getContinuousQuestions(posts);
  const cdfs = await Promise.all(
    questions.map((question) => fetchCdfAt(question, asOf))
  );
  return Object.fromEntries(
    questions.flatMap((question, index) => {
      const cdf = cdfs[index];
      return cdf ? [[question.id, cdf]] : [];
    })
  );
}
