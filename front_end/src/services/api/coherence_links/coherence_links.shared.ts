import { ApiService } from "@/services/api/api_service";
import { clientPath } from "@/services/api/client_path";
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
  // The suggested link's configuration, as a CoherenceLink stores it.
  target_is_cause: boolean;
  direction: 1 | -1;
  strength: number;
};

export type FetchedSuggestedLinks = {
  data: SuggestedLinkEntry[];
};

class CoherenceLinksApi extends ApiService {
  static readonly clientRoutes = {
    links: "/coherence/question/:questionId/links/",
    aggregateLinks: "/coherence/question/:questionId/aggregate-links/",
  } as const;

  /**
   * Retrieves coherence links associated with a post's question.
   * @param question - The question to get coherence links for
   * @returns Promise resolving to the coherence links data
   * @throws Error if the post doesn't have an associated question
   */
  async getCoherenceLinksForPost(
    question: Question
  ): Promise<FetchedCoherenceLinks> {
    return await this.get(
      clientPath(CoherenceLinksApi.clientRoutes.links, {
        questionId: question.id,
      })
    );
  }
  async getAggregateCoherenceLinksForPost(
    question: Question
  ): Promise<FetchedAggregateCoherenceLinks> {
    return await this.get(
      clientPath(CoherenceLinksApi.clientRoutes.aggregateLinks, {
        questionId: question.id,
      })
    );
  }

  async getQuestionsRequiringUpdate(questionId: number) {
    return await this.get(
      `/coherence/question/links/${questionId}/needs-update/`
    );
  }

  /**
   * Retrieves AI-driven question-link suggestions for a question. The first
   * request for a question computes them, which takes several seconds.
   * Returns an empty list when the feature is off or unavailable.
   */
  async getSuggestedLinksForQuestion(
    questionId: number
  ): Promise<FetchedSuggestedLinks> {
    return await this.get(`/coherence/question/${questionId}/suggested-links/`);
  }
}

export default CoherenceLinksApi;
