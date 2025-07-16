import { ApiService } from "@/services/api/api_service";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

class ServerCoherenceLinksApiClass extends ApiService {
  async createCoherenceLink<T, B>(body: B): Promise<T> {
    return await this.post(`/coherence/create-link/`, body);
  }

  async deleteCoherenceLink(id: number) {
    return await this.delete(`/coherence/delete/${id}`);
  }
}
export const coherenceLinksApiClass = new ServerCoherenceLinksApiClass(
  serverFetcher
);
