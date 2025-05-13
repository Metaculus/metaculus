import { AggregationQuestion } from "@/types/question";
import { get } from "@/utils/core/fetch";

export type AggregationExplorerParams = {
  postId?: number | string | null;
  questionId?: number | string | null;
  includeBots?: boolean;
  aggregationMethods?: string;
};

class AggregationExplorerAPI {
  static async getAggregations(params: AggregationExplorerParams) {
    const queryParams: Record<string, string> = {
      post_id: params.postId?.toString() || "",
      question_id: params.questionId?.toString() || "",
      include_bots: params.includeBots?.toString() || "false",
      aggregation_methods: params.aggregationMethods || "",
    };

    const queryString = new URLSearchParams(queryParams).toString();

    return await get<AggregationQuestion>(
      `/aggregation_explorer/?${queryString}`
    );
  }
}

export default AggregationExplorerAPI;
