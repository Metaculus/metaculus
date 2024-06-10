"use server";

import PostsApi, { PostsParams } from "@/services/posts";
import QuestionsApi from "@/services/questions";
import { FetchError } from "@/types/fetch";
import { ForecastData } from "@/types/question";
import { VoteDirection } from "@/types/votes";

export async function fetchMorePosts(
  filters: PostsParams,
  offset: number,
  limit: number
) {
  const response = await PostsApi.getPostWithoutForecasts({
    ...filters,
    offset,
    limit,
  });
  return response.results;
}

export async function votePost(postId: number, direction: VoteDirection) {
  try {
    return await PostsApi.votePost(postId, direction);
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
