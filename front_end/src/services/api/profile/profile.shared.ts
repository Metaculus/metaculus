import { ApiService } from "@/services/api/api_service";
import { FetchOptions } from "@/types/fetch";
import {
  CurrentBot,
  User,
  UserProfile,
  UserProfileWithStats,
} from "@/types/users";
import { encodeQueryParams } from "@/utils/navigation";

class ProfileApi extends ApiService {
  async getProfileById(
    id: number,
    options: { includeStats: true },
    fetchOptions?: FetchOptions
  ): Promise<UserProfileWithStats>;
  async getProfileById(
    id: number,
    options?: { includeStats?: false },
    fetchOptions?: FetchOptions
  ): Promise<UserProfile>;
  async getProfileById(
    id: number,
    { includeStats = false }: { includeStats?: boolean } = {},
    fetchOptions?: FetchOptions
  ): Promise<UserProfile | UserProfileWithStats> {
    return await this.get<UserProfileWithStats>(
      `/users/${id}/${encodeQueryParams({ include_stats: includeStats })}`,
      fetchOptions
    );
  }

  async searchUsers(query: string, postId?: number) {
    const params: Record<string, string | number> = { search: query };
    if (postId) {
      params.post_id = postId;
    }
    return await this.get<User[]>(`/users/${encodeQueryParams(params)}`);
  }

  async getMyBots() {
    return await this.get<CurrentBot[]>(`/users/me/bots/`);
  }
}

export default ProfileApi;
