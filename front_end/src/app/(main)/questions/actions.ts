"use server";

import PostsApi, { PostsParams } from "@/services/posts";
import { FetchError } from "@/types/fetch";
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
