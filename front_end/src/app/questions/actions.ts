"use server";

import QuestionsApi, { QuestionsParams } from "@/services/questions";

export async function fetchMoreQuestions(
  filters: QuestionsParams,
  offset: number,
  limit: number
) {
  const response = await QuestionsApi.getQuestionsWithoutForecasts({
    ...filters,
    offset,
    limit,
  });
  return response.results;
}
