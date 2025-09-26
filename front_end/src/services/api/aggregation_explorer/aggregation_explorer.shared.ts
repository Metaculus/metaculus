import { ApiService } from "@/services/api/api_service";
import { AggregationQuestion } from "@/types/question";
import { encodeQueryParams } from "@/utils/navigation";

type AggregationExplorerParams = {
  postId?: number | string | null;
  questionId?: number | string | null;
  includeBots?: boolean;
  aggregationMethods?: string;
  userIds?: number[];
};

class AggregationExplorerApi extends ApiService {
  async getAggregations(params: AggregationExplorerParams) {
    const queryParams = encodeQueryParams({
      post_id: params.postId?.toString() || "",
      question_id: params.questionId?.toString() || "",
      include_bots: params.includeBots?.toString() || "false",
      aggregation_methods: params.aggregationMethods || "",
      ...(params.userIds !== undefined ? { user_ids: params.userIds } : {}),
    });

    return await this.get<AggregationQuestion>(
      `/aggregation_explorer/${queryParams}`
    );
  }
}

export default AggregationExplorerApi;
