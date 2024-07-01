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

  static async resolve(id: number, resolution: string) {
    return post<null, { resolution: string }>(`/questions/${id}/resolve/`, {
      resolution: resolution,
    });
  }
}

export default QuestionsApi;
