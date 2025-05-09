import { ApiService } from "@/services/api/api_service";
import { PaginatedPayload } from "@/types/fetch";
import { CurrentUser, UserProfile } from "@/types/users";

class ProfileApi extends ApiService {
  async getProfileById(id: number): Promise<CurrentUser> {
    return await this.get<CurrentUser>(`/users/${id}/`);
  }

  async searchUsers(query: string) {
    return await this.get<PaginatedPayload<UserProfile>>(
      `/users/?search=${query}`
    );
  }
}

export default ProfileApi;
