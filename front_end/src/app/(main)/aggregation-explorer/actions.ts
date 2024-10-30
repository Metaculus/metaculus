"use server";

import AggregationExplorerAPI, {
  AggregationExplorerParams,
} from "@/services/aggregation_explorer";

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
