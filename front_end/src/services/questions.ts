import { PaginatedPayload } from "@/types/fetch";
import { Question, QuestionWithForecasts } from "@/types/question";
import { get } from "@/utils/fetch";
import { encodeQueryParams } from "@/utils/query_params";

export type QuestionsParams = {
  topic?: string;
  answered_by_me?: boolean;
  search?: string;
  limit?: number;
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
  // TODO: properly handle array params
  projects?: string;
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
  ): Promise<QuestionWithForecasts[]> {
    const queryParams = encodeQueryParams({
      ...(params ?? {}),
      with_forecasts: true,
    });

    try {
      const data = await get<PaginatedPayload<QuestionWithForecasts>>(
        `/questions${queryParams}`
      );
      return data.results;
    } catch (err) {
      console.error("Error getting questions:", err);
      return [];
    }
  }
}

export default QuestionsApi;
