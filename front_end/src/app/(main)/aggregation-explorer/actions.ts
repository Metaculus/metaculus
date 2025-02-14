"use server";

import AggregationExplorerAPI, {
  AggregationExplorerParams,
} from "@/services/aggregation_explorer";
import PostApi from "@/services/posts";
import { AggregationMethod } from "@/types/question";

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

export async function getAggregationsPostZipData(
  postId: number,
  subQuestionId?: number,
  aggregationMethod?: AggregationMethod,
  includeBots?: boolean
) {
  const blob = await PostApi.getAggregationsPostZipData(
    postId,
    subQuestionId,
    aggregationMethod,
    includeBots
  );
  const arrayBuffer = await blob.arrayBuffer();
  const base64String = Buffer.from(arrayBuffer).toString("base64");

  return `data:application/octet-stream;base64,${base64String}`;
}
