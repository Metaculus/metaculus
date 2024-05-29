import { PaginatedPayload } from "@/types/fetch";
import { Question } from "@/types/question";
import { get } from "@/utils/fetch";

class QuestionsApi {
  static async getQuestion(id: number): Promise<Question | null> {
    try {
      return await get<Question>(`/questions/${id}`);
    } catch (err) {
      console.error("Error getting question:", err);
      return null;
    }
  }

  static async getQuestions(): Promise<Question[]> {
    try {
      const data = await get<PaginatedPayload<Question>>("/questions");
      return data.results;
    } catch (err) {
      console.error("Error getting questions:", err);
      return [];
    }
  }
}

export default QuestionsApi;
