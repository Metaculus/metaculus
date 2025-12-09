import { ApiService } from "@/services/api/api_service";
import type {
  FetchedAggregateCoherenceLinks,
  FetchedCoherenceLinks,
} from "@/types/coherence";
import { Question } from "@/types/question";

export type AggregateLinkVoteValue = 1 | -1 | null;

class CoherenceLinksApi extends ApiService {
  /**
   * Retrieves coherence links associated with a post's question.
   * @param question - The question to get coherence links for
   * @returns Promise resolving to the coherence links data
   * @throws Error if the post doesn't have an associated question
   */
  async getCoherenceLinksForPost(
    question: Question
  ): Promise<FetchedCoherenceLinks> {
    return await this.get(`/coherence/question/${question.id}/links/`);
  }
  async getAggregateCoherenceLinksForPost(
    question: Question
  ): Promise<FetchedAggregateCoherenceLinks> {
    return await this.get(
      `/coherence/question/${question.id}/aggregate-links/`
    );
  }

  async getQuestionsRequiringUpdate(questionId: number) {
    return await this.get(
      `/coherence/question/links/${questionId}/needs-update/`
    );
  }
}

export default CoherenceLinksApi;
