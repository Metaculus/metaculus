import { AggregationMethod, QuestionWithForecasts } from "@/types/question";
import { encodeQueryParams } from "@/utils/navigation";
import { get } from "@/utils/fetch";

export type AggregationExplorerParams = {
  questionId: number;
  aggregationMethods?: AggregationMethod[];
  userIds?: number[];
  includeBots?: boolean;
};

class AggregationExplorerAPI {
  static async getAggregations(
    params: AggregationExplorerParams
  ): Promise<QuestionWithForecasts> {
    const encodedParams = encodeQueryParams(params);
    console.log(encodedParams);
    return await get<QuestionWithForecasts>(
      `/aggregation_explorer/${encodedParams}`
    );
  }
}

export default AggregationExplorerAPI;
