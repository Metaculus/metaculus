import "server-only";
import { ApiService } from "@/services/api/api_service";
import {
  DistributionQuantile,
  DistributionSlider,
  ForecastData,
} from "@/types/question";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

export type ForecastPayload = {
  questionId: number;
  forecastData: ForecastData;
  distributionInput?: DistributionSlider | DistributionQuantile | null;
  forecastEndTime?: Date;
};
export type WithdrawalPayload = {
  question: number;
  withdrawal_at?: string;
};

class ServerQuestionsApiClass extends ApiService {
  async createForecasts(forecasts: ForecastPayload[]): Promise<Response> {
    return await this.post(
      `/questions/forecast/`,
      forecasts.map(
        ({ questionId, forecastData, distributionInput, forecastEndTime }) => ({
          question: questionId,
          continuous_cdf: forecastData.continuousCdf,
          probability_yes: forecastData.probabilityYes,
          probability_yes_per_category: forecastData.probabilityYesPerCategory,
          distribution_input: distributionInput,
          source: "ui",
          end_time: forecastEndTime,
        })
      )
    );
  }

  async withdrawForecasts(withdrawals: WithdrawalPayload[]): Promise<Response> {
    return await this.post(`/questions/withdraw/`, withdrawals);
  }

  async resolve(id: number, resolution: string, actual_resolve_time: string) {
    return this.post<
      { post_id: number },
      { resolution: string; actual_resolve_time: string }
    >(`/questions/${id}/resolve/`, {
      resolution: resolution,
      actual_resolve_time: actual_resolve_time,
    });
  }

  async unresolve(id: number) {
    return this.post<{ post_id: number }>(`/questions/${id}/unresolve/`, {});
  }

  async legacyGetPostId(questionId: number) {
    return this.get<{ post_id: number; post_slug: string }>(
      `/questions/${questionId}/post/`
    );
  }
}

const ServerQuestionsApi = new ServerQuestionsApiClass(serverFetcher);
export default ServerQuestionsApi;
