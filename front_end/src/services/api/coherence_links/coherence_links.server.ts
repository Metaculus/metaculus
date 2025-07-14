import { ApiService } from "@/services/api/api_service";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

class CoherenceLinksApiClass extends ApiService {
  async createCoherenceLink<T, B>(body: B): Promise<T> {
    return await this.post(`/coherence/create-link/`, body);
  }

  async getCoherenceLinksForQuestion<T>(id: number): Promise<T> {
    return await this.get(`/coherence/get-links/${id}`);
  }
}
export const coherenceLinksApiClass = new CoherenceLinksApiClass(serverFetcher);
