import { AggregationQuestion } from "@/types/question";
import { get } from "@/utils/fetch";

export type AggregationExplorerParams = {
  questionId: number | string;
  includeBots?: boolean;
  aggregationMethods?: string;
};

class AggregationExplorerAPI {
  static async getAggregations(params: AggregationExplorerParams) {
    const queryParams: Record<string, string> = {
      question_id: params.questionId.toString(),
      include_bots: params.includeBots?.toString() || "false",
      aggregation_methods: params.aggregationMethods || ''
    };

    const queryString = new URLSearchParams(queryParams).toString();

    // Adjust the endpoint if necessary
    return await get<AggregationQuestion>(`/aggregation_explorer/?${queryString}`);
  }
}

export default AggregationExplorerAPI;
