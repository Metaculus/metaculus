import { AggregationExtraQuestion } from "@/app/(main)/aggregation-explorer/types";
import { ApiService } from "@/services/api/api_service";
import { encodeQueryParams } from "@/utils/navigation";

type AggregationExplorerParams = {
  postId?: number | string | null;
  questionId?: number | string | null;
  includeBots?: boolean;
  onlyBots?: boolean;
  aggregationMethods?: string;
  userIds?: number[];
  joinedBeforeDate?: string;
};

class AggregationExplorerApi extends ApiService {
  async getAggregations(params: AggregationExplorerParams) {
    const queryParams = encodeQueryParams({
      post_id: params.postId?.toString() || "",
      question_id: params.questionId?.toString() || "",
      include_bots: params.includeBots?.toString() || "false",
      only_bots: params.onlyBots?.toString() || "false",
      aggregation_methods: params.aggregationMethods || "",
      joined_before_date: params.joinedBeforeDate || "",
      ...(params.userIds !== undefined ? { user_ids: params.userIds } : {}),
    });

    return await this.get<AggregationExtraQuestion>(
      `/aggregation_explorer/${queryParams}`
    );
  }
}

export default AggregationExplorerApi;
