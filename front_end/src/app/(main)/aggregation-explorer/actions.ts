"use server";

import AggregationExplorerAPI, {
  AggregationExplorerParams,
} from "@/services/aggregation_explorer";
import PostApi from "@/services/posts";

export async function fetchAggregations({
  postId,
  questionId,
  includeBots,
  aggregationMethods,
}: AggregationExplorerParams) {
  const response = await AggregationExplorerAPI.getAggregations({
    postId,
    questionId,
    includeBots,
    aggregationMethods,
  });
  return response;
}

export async function fetchPost(postId: number) {
  const response = await PostApi.getPost(postId, false);
  return response;
}

export async function fetchQuestion(questionId: number) {
  const response = await PostApi.getQuestion(questionId, false);
  return response;
}
