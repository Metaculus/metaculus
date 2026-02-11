import { ApiService } from "@/services/api/api_service";
import { PaginatedPayload } from "@/types/fetch";
import { CurrentBot, UserProfile } from "@/types/users";

class ProfileApi extends ApiService {
  async getProfileById(id: number): Promise<UserProfile> {
    return await this.get<UserProfile>(`/users/${id}/`);
  }

  async searchUsers(query: string, postId?: number) {
    const params = new URLSearchParams();
    params.set("search", query);
    if (postId) {
      params.set("post_id", String(postId));
    }
    return await this.get<PaginatedPayload<UserProfile>>(
      `/users/?${params.toString()}`
    );
  }

  async getMyBots() {
    return await this.get<CurrentBot[]>(`/users/me/bots/`);
  }
}

export default ProfileApi;
