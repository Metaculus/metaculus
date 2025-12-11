import { ApiService } from "@/services/api/api_service";
import { PaginatedPayload } from "@/types/fetch";
import { UserProfile } from "@/types/users";

class ProfileApi extends ApiService {
  async getProfileById(id: number): Promise<UserProfile> {
    return await this.get<UserProfile>(`/users/${id}/`);
  }

  async searchUsers(query: string) {
    return await this.get<PaginatedPayload<UserProfile>>(
      `/users/?search=${query}`
    );
  }
}

export default ProfileApi;
