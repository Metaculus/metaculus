import { ApiService } from "@/services/api/api_service";
import {
  FetchedAggregateCoherenceLinks,
  FetchedCoherenceLinks,
} from "@/types/coherence";
import { Question } from "@/types/question";

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
    return await this.get(`/coherence/links/${question.id}/`);
  }
  async getAggregateCoherenceLinksForPost(
    question: Question
  ): Promise<FetchedAggregateCoherenceLinks> {
    return await this.get(`/coherence/aggregate-links/${question.id}/`);
  }
}

export default CoherenceLinksApi;
