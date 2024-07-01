"use server";

import { revalidatePath } from "next/cache";

import CommentsApi, { EditCommentParams } from "@/services/comments";
import PostsApi, { PostsParams } from "@/services/posts";
import QuestionsApi from "@/services/questions";
import { FetchError } from "@/types/fetch";
import { PostStatus } from "@/types/post";
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

export async function fetchEmbedPosts(search: string) {
  const response = await PostsApi.getPostWithoutForecasts({
    search: search || undefined,
    limit: search ? undefined : 10,
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

export async function createForecasts(
  postId: number,
  forecasts: Array<{
    questionId: number;
    forecastData: ForecastData;
    sliderValues: any;
  }>
) {
  try {
    const promises = forecasts.map(
      ({ questionId, forecastData, sliderValues }) =>
        createForecast(questionId, forecastData, sliderValues)
    );

    const responses = await Promise.all(promises);

    revalidatePath(`/questions/${postId}`);

    return responses;
  } catch (err) {
    const error = err as FetchError;

    return [error];
  }
}

export async function getPost(postId: number) {
  const response = await PostsApi.getPost(postId);
  return response;
}

export async function approvePost(postId: number) {
  const response = await PostsApi.updatePost(postId, {
    curation_status: PostStatus.APPROVED,
  });
  return response;
}

export async function draftPost(postId: number) {
  const response = await PostsApi.updatePost(postId, {
    curation_status: PostStatus.DRAFT,
  });
  return response;
}

export async function updateNotebook(
  postId: number,
  markdown: string,
  title: string
) {
  const response = await PostsApi.updatePost(postId, {
    title: title,
    notebook: {
      markdown,
    },
  });
  revalidatePath(`/notebooks/${postId}`);

  return response;
}

export async function resolveQuestion(
  questionId: number,
  resolution: string,
  resolution_known_at: string
) {
  try {
    return await QuestionsApi.resolve(
      questionId,
      resolution,
      resolution_known_at
    );
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function uploadImage(formData: FormData) {
  try {
    return await PostsApi.uploadImage(formData);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function softDeleteComment(commentId: number) {
  try {
    return await CommentsApi.softDeleteComment(commentId);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function editComment(commentData: EditCommentParams) {
  try {
    return await CommentsApi.editComment(commentData);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function createComment(commentData: any) {
  try {
    return await CommentsApi.createComment(commentData);
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}
