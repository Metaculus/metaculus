"use server";

import AggregationExplorerAPI, {
  AggregationExplorerParams,
} from "@/services/aggregation_explorer";

export async function fetchAggregations({
  questionId,
  includeBots,
  aggregationMethods,
}: AggregationExplorerParams) {
  const response = await AggregationExplorerAPI.getAggregations({
    questionId,
    includeBots,
    aggregationMethods
  });
  return response;
}
