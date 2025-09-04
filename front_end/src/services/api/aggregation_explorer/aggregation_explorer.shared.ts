import { ApiService } from "@/services/api/api_service";
import { AggregationQuestion } from "@/types/question";

type AggregationExplorerParams = {
  postId?: number | string | null;
  questionId?: number | string | null;
  includeBots?: boolean;
  aggregationMethods?: string;
  userIdsText?: string;
};

class AggregationExplorerApi extends ApiService {
  async getAggregations(params: AggregationExplorerParams) {
    const queryParams: Record<string, string> = {
      post_id: params.postId?.toString() || "",
      question_id: params.questionId?.toString() || "",
      include_bots: params.includeBots?.toString() || "false",
      aggregation_methods: params.aggregationMethods || "",
      user_ids: params.userIdsText || "",
    };

    const queryString = new URLSearchParams(queryParams).toString();

    return await this.get<AggregationQuestion>(
      `/aggregation_explorer/?${queryString}`
    );
  }
}

export default AggregationExplorerApi;
