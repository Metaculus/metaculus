import { ForecastData } from "@/types/question";
import { post } from "@/utils/fetch";

class QuestionsApi {
  static async createForecast(
    questionId: number,
    forecastData: ForecastData
  ): Promise<Response> {
    return await post<Response>(`/questions/${questionId}/forecast/`, {
      continuous_cdf: forecastData.continuousCdf,
      probability_yes: forecastData.probabilityYes,
      probability_yes_per_category: forecastData.probabilityYesPerCategory,
    });
  }
}

export default QuestionsApi;
