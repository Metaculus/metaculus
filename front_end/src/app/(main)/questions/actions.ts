"use server";

import { revalidatePath } from "next/cache";

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

export async function createQuestionPost(body: any) {
  try {
    const post = await PostsApi.createQuestionPost(body);
    return {
      post: post,
    };
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function createForecast(
  questionId: number,
  forecastData: ForecastData,
  sliderValues: any
) {
  try {
    const response = await QuestionsApi.createForecast(
      questionId,
      forecastData,
      sliderValues
    );
    revalidatePath(`/questions/${questionId}`);

    return response;
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function getPost(postId: number) {
  const response = await PostsApi.getPost(postId);
  return response;
}
