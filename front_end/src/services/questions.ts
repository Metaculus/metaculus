import { ForecastData } from "@/types/question";
import { VoteResponse } from "@/types/votes";
import { post } from "@/utils/fetch";

class QuestionsApi {
  static async createForecast(
    questionId: number,
    forecastData: ForecastData
  ): Promise<VoteResponse> {
    return await post<VoteResponse>(`/questions/${questionId}/forecast/`, {
      continuous_cdf: forecastData.continuousCdf,
      probability_yes: forecastData.probabilityYes,
      probability_yes_per_category: forecastData.probabilityYesPerCategory,
    });
  }
}

export default QuestionsApi;
