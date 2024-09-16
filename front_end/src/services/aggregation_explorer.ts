import { get } from "@/utils/fetch";

export type AggregationExplorerParams = {
  questionId: number | string;
  includeBots?: boolean;
};

class AggregationExplorerAPI {
  static async getAggregations(params: AggregationExplorerParams) {
    const queryString = new URLSearchParams({
      question_id: params.questionId.toString(),
      include_bots: params.includeBots?.toString() || "false",
    }).toString();

    // Adjust the endpoint if necessary
    return await get(`/api/aggregation_explorer?${queryString}`);
  }
}

export default AggregationExplorerAPI;
