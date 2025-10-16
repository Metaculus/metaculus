import "server-only";
import { ApiService } from "@/services/api/api_service";
import { FetchedCoherenceLinks } from "@/types/coherence";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

class ServerCoherenceLinksApiClass extends ApiService {
  /**
  Creates a new coherence link between two questions.
  @param body - The coherence link configuration
  @param body.question1_id - ID of the first question
  @param body.question2_id - ID of the second question
  @param body.direction - The directional relationship between questions
  @param body.strength - The strength of the connection
  @param body.type - The type of the coherence link
  @returns Promise resolving to the created coherence link data
  */
  async createCoherenceLink(body: {
    question1_id: number;
    question2_id: number;
    direction: number;
    strength: number;
    type: string;
  }): Promise<FetchedCoherenceLinks> {
    return await this.post(`/coherence/links/create/`, body);
  }

  /**
  Deletes an existing coherence link by its ID.
  @param id - The unique identifier of the coherence link to delete
  @returns Promise resolving to HTTP 204 No Content response
  */

  async deleteCoherenceLink(id: number) {
    return await this.delete(`/coherence/links/${id}/delete/`);
  }
}
export const CoherenceLinksApiClass = new ServerCoherenceLinksApiClass(
  serverFetcher
);
