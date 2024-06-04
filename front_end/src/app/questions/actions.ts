"use server";

import { revalidatePath } from "next/cache";

import QuestionsApi, { QuestionsParams } from "@/services/questions";
import { FetchError } from "@/types/fetch";
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
    const response = await QuestionsApi.voteQuestion(questionId, direction);
    revalidatePath("/");

    return response;
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}
