import { ApiService } from "@/services/api/api_service";
import {
  FetchedAggregateCoherenceLinks,
  FetchedCoherenceLinks,
} from "@/types/coherence";
import { Post } from "@/types/post";

class CoherenceLinksApi extends ApiService {
  /**
   * Retrieves coherence links associated with a post's question.
   * @param post - The post containing the question to get coherence links for
   * @returns Promise resolving to the coherence links data
   * @throws Error if the post doesn't have an associated question
   */
  async getCoherenceLinksForPost(post: Post): Promise<FetchedCoherenceLinks> {
    if (!post.question)
      throw new Error("Post doesn't have only one associated question");
    const question = post.question;
    return await this.get(`/coherence/links/${question.id}/`);
  }
  async getAggregateCoherenceLinksForPost(
    post: Post
  ): Promise<FetchedAggregateCoherenceLinks> {
    if (!post.question)
      throw new Error("Post doesn't have only one associated question");
    const question = post.question;
    return await this.get(`/coherence/aggregate-links/${question.id}/`);
  }
}

export default CoherenceLinksApi;
