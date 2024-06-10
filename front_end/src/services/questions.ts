import { PaginatedPayload } from "@/types/fetch";
import {
  ForecastData,
  Question,
  QuestionWithForecasts,
} from "@/types/question";
import { VoteDirection, VoteResponse } from "@/types/votes";
import { get, post } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/query_params";

export type QuestionsParams = {
  topic?: string;
  answered_by_me?: boolean;
  search?: string;
  limit?: number;
  offset?: number;
  forecast_type?: string | string[];
  status?: string | string[];
  categories?: string | string[];
  tags?: string | string[];
  guessed_by?: string;
  not_guessed_by?: string;
  author?: string;
  upvoted_by?: string;
  access?: string;
  commented_by?: string;
  order_by?: string;
  tournaments?: string | string[];
};

class QuestionsApi {
  static async getQuestion(id: number): Promise<QuestionWithForecasts | null> {
    try {
      return await get<QuestionWithForecasts>(
        `/questions/${id}${encodeQueryParams({ with_forecasts: true })}`
      );
    } catch (err) {
      console.error("Error getting question:", err);
      return null;
    }
  }

  static async getQuestions(params?: QuestionsParams): Promise<Question[]> {
    const queryParams = encodeQueryParams(params ?? {});
    try {
      const data = await get<PaginatedPayload<Question>>(
        `/questions${queryParams}`
      );
      return data.results;
    } catch (err) {
      console.error("Error getting questions:", err);
      return [];
    }
  }

  static async getQuestionsWithoutForecasts(
    params?: QuestionsParams
  ): Promise<PaginatedPayload<QuestionWithForecasts>> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_forecasts: true,
    });

    try {
      return await get<PaginatedPayload<QuestionWithForecasts>>(
        `/questions${queryParams}`
      );
    } catch (err) {
      console.error("Error getting questions:", err);
      return { count: 0, results: [], next: null, previous: null };
    }
  }

  static async voteQuestion(
    id: number,
    direction: VoteDirection
  ): Promise<VoteResponse> {
    return await post<VoteResponse>(`/questions/${id}/vote`, { direction });
  }

  static async createForecast(
    questionId: number,
    forecastData: ForecastData
  ): Promise<VoteResponse> {
    return await post<VoteResponse>(`/forecast/create/`, {
      continuous_cdf: forecastData.continuousCdf,
      probability_yes: forecastData.probabilityYes,
      probability_yes_per_category: forecastData.probabilityYesPerCategory,
    });
  }
}

export default QuestionsApi;
