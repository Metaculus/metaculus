import { ApiService } from "@/services/api/api_service";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

class CoherenceLinksApiClass extends ApiService {
  async createCoherenceLink<T, B>(body: B): Promise<T> {
    console.log("Inside CoherenceLinksApiClass");
    return await this.post(`/coherence/create-link/`, body);
  }
}
export const coherenceLinksApiClass = new CoherenceLinksApiClass(serverFetcher);
