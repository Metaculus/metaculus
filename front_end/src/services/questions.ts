import { ForecastData } from "@/types/question";
import { post } from "@/utils/fetch";

class QuestionsApi {
  static async createForecast(
    questionId: number,
    forecastData: ForecastData,
    sliderValues: any
  ): Promise<Response> {
    return await post<Response>(`/questions/${questionId}/forecast/`, {
      continuous_cdf: forecastData.continuousCdf,
      probability_yes: forecastData.probabilityYes,
      probability_yes_per_category: forecastData.probabilityYesPerCategory,
      slider_values: sliderValues,
    });
  }

  static async resolve(
    id: number,
    resolution: string,
    resolution_known_at: string
  ) {
    return post<
      { post_id: number },
      { resolution: string; resolution_known_at: string }
    >(`/questions/${id}/resolve/`, {
      resolution: resolution,
      resolution_known_at: resolution_known_at,
    });
  }
}

export default QuestionsApi;
