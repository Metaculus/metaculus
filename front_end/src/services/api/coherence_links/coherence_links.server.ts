import "server-only";
import { ApiService } from "@/services/api/api_service";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

class ServerCoherenceLinksApiClass extends ApiService {
  async createCoherenceLink<T, B>(body: B): Promise<T> {
    return await this.post(`/coherence/links/create/`, body);
  }

  async deleteCoherenceLink(id: number) {
    return await this.delete(`/coherence/links/${id}/delete/`);
  }
}
export const CoherenceLinksApiClass = new ServerCoherenceLinksApiClass(
  serverFetcher
);
