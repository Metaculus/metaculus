"use client";

import { useQuery } from "@tanstack/react-query";

import ClientAggregationExplorerApi from "@/services/api/aggregation_explorer/aggregation_explorer.client";
import { NumericAggregateForecastHistory } from "@/types/question";

export function useFullAggregation(
  questionId: number,
  defaultAggregationMethod: string,
  includeBots: boolean,
  enabled: boolean
) {
  return useQuery({
    queryKey: [
      "full-aggregation",
      questionId,
      defaultAggregationMethod,
      includeBots,
    ],
    enabled,
    queryFn: async () => {
      const result = await ClientAggregationExplorerApi.getAggregations({
        questionId,
        aggregationMethods: defaultAggregationMethod,
        includeBots,
      });
      return (
        (
          result.aggregations as Record<
            string,
            NumericAggregateForecastHistory | undefined
          >
        )[defaultAggregationMethod] ?? null
      );
    },
  });
}
