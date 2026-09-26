import { ApiService } from "@/services/api/api_service";
import type {
  FetchedAggregateCoherenceLinks,
  FetchedCoherenceLinks,
} from "@/types/coherence";
import { PostWithForecasts } from "@/types/post";
import { Question } from "@/types/question";

export type AggregateLinkVoteValue = 1 | -1 | null;

export type SuggestedLinkEntry = {
  post: PostWithForecasts;
  // Which sub-question of `post` the suggestion actually points at.
  // For non-group posts this is just the post's question id.
  suggested_question_id: number;
  // How many suggestion methods agreed on this candidate.
  score: number;
};

export type FetchedSuggestedLinks = {
  data: SuggestedLinkEntry[];
};

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

  /**
   * Retrieves AI-driven question-link suggestions for a question.
   * Returns an empty list if SUGGESTIONS_AI_ENABLED is off on the server
   * or no suggestions have been computed for the target yet.
   */
  async getSuggestedLinksForQuestion(
    questionId: number
  ): Promise<FetchedSuggestedLinks> {
    return await this.get(`/coherence/question/${questionId}/suggested-links/`);
  }
}

export default CoherenceLinksApi;
