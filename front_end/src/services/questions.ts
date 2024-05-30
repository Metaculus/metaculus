import { PaginatedPayload } from "@/types/fetch";
import { Question, QuestionWithForecasts } from "@/types/question";
import { encodeQueryParams, get } from "@/utils/fetch";

type QuestionsParams = {
  topic?: string;
  answered_by_me?: boolean;
  // TODO: properly handle array params
  tags?: string;
  categories?: string;
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
    const queryParams = encodeQueryParams({ ...params, limit: 10, with_forecasts: true });
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
      with_forecasts: false,
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
