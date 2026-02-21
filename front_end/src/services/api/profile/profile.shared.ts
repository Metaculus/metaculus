import { ApiService } from "@/services/api/api_service";
import { CurrentBot, UserProfile } from "@/types/users";
import { encodeQueryParams } from "@/utils/navigation";

class ProfileApi extends ApiService {
  async getProfileById(id: number): Promise<UserProfile> {
    return await this.get<UserProfile>(`/users/${id}/`);
  }

  async searchUsers(query: string, postId?: number) {
    const params: Record<string, string | number> = { search: query };
    if (postId) {
      params.post_id = postId;
    }
    return await this.get<UserProfile[]>(`/users/${encodeQueryParams(params)}`);
  }

  async getMyBots() {
    return await this.get<CurrentBot[]>(`/users/me/bots/`);
  }
}

export default ProfileApi;
