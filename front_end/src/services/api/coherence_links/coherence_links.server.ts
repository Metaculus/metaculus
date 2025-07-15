import { ApiService } from "@/services/api/api_service";
import { CoherenceLinksGroup } from "@/types/coherence";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

class CoherenceLinksApiClass extends ApiService {
  async createCoherenceLink<T, B>(body: B): Promise<T> {
    return await this.post(`/coherence/create-link/`, body);
  }

  async getCoherenceLinksForQuestion(id: number): Promise<CoherenceLinksGroup> {
    return await this.get(`/coherence/get-links/${id}`);
  }

  async deleteCoherenceLink(id: number) {
    return await this.delete(`/coherence/delete/${id}`);
  }
}
export const coherenceLinksApiClass = new CoherenceLinksApiClass(serverFetcher);
