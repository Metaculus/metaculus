import {
  DistributionQuantile,
  DistributionSlider,
  ForecastData,
} from "@/types/question";
import { get, post } from "@/utils/fetch";

export type ForecastPayload = {
  questionId: number;
  forecastData: ForecastData;
  distributionInput?: DistributionSlider | DistributionQuantile | null;
};
export type WithdrawalPayload = {
  question: number;
  withdrawal_at?: string;
};

class QuestionsApi {
  static async createForecasts(
    forecasts: ForecastPayload[]
  ): Promise<Response> {
    return await post(
      `/questions/forecast/`,
      forecasts.map(({ questionId, forecastData, distributionInput }) => ({
        question: questionId,
        continuous_cdf: forecastData.continuousCdf,
        probability_yes: forecastData.probabilityYes,
        probability_yes_per_category: forecastData.probabilityYesPerCategory,
        distribution_input: distributionInput,
        source: "ui",
      }))
    );
  }

  static async withdrawForecasts(
    withdrawals: WithdrawalPayload[]
  ): Promise<Response> {
    return await post(`/questions/withdraw/`, withdrawals);
  }

  static async resolve(
    id: number,
    resolution: string,
    actual_resolve_time: string
  ) {
    return post<
      { post_id: number },
      { resolution: string; actual_resolve_time: string }
    >(`/questions/${id}/resolve/`, {
      resolution: resolution,
      actual_resolve_time: actual_resolve_time,
    });
  }

  static async unresolve(id: number) {
    return post<{ post_id: number }>(`/questions/${id}/unresolve/`, {});
  }

  static async legacyGetPostId(questionId: number) {
    return get<{ post_id: number; post_slug: string }>(
      `/questions/${questionId}/post/`
    );
  }
}

export default QuestionsApi;
