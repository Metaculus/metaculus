"use server";

import QuestionsApi, { QuestionsParams } from "@/services/questions";
import { FetchError } from "@/types/fetch";
import { ForecastData } from "@/types/question";
import { VoteDirection } from "@/types/votes";

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

export async function voteQuestion(
  questionId: number,
  direction: VoteDirection
) {
  try {
    return await QuestionsApi.voteQuestion(questionId, direction);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function createForecast(
  questionId: number,
  forecastData: ForecastData
) {
  try {
    return await QuestionsApi.createForecast(questionId, forecastData);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}
