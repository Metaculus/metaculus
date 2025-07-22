import { ApiService } from "@/services/api/api_service";
import { CoherenceLinksGroup } from "@/types/coherence";
import { Post } from "@/types/post";

class CoherenceLinksApi extends ApiService {
  async getCoherenceLinksForPost(post: Post): Promise<CoherenceLinksGroup> {
    if (!post.question)
      throw new Error("Post doesn't have only one associated question");
    const question = post.question;
    return await this.get(`/coherence/links/${question.id}/`);
  }
}

export default CoherenceLinksApi;
