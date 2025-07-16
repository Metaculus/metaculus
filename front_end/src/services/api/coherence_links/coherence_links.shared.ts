import { ApiService } from "@/services/api/api_service";
import { CoherenceLinksGroup } from "@/types/coherence";
import { Question } from "@/types/question";
import { ApiError } from "@/utils/core/errors";

class CoherenceLinksApi extends ApiService {
  async getCoherenceLinksForQuestion(
    question: Question
  ): Promise<CoherenceLinksGroup | { errors: unknown }> {
    try {
      return await this.get(`/coherence/get-links/${question.id}`);
    } catch (err) {
      return {
        errors: ApiError.isApiError(err) ? err.data : undefined,
      };
    }
  }
}

export default CoherenceLinksApi;
