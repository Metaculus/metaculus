import { getServerSession } from "@/services/session";
import { PaginatedPayload } from "@/types/fetch";
import { SubscriptionEmailType } from "@/types/notifications";
import { CurrentUser, UserProfile } from "@/types/users";
import { get, patch, post } from "@/utils/fetch";

class ProfileApi {
  static async getMyProfile(): Promise<CurrentUser | null> {
    const token = getServerSession();

    if (!token) {
      return null;
    }

    return await get<CurrentUser>("/users/me");
  }

  static async getProfileById(id: number): Promise<CurrentUser> {
    return await get<CurrentUser>(`/users/${id}`);
  }

  static async changeUsername(username: string) {
    return post<CurrentUser, { username: string }>("/users/change-username", {
      username,
    });
  }

  static async updateProfile(props: {
    bio?: string;
    website?: string;
    unsubscribed_mailing_tags?: SubscriptionEmailType[];
  }) {
    return patch<CurrentUser, typeof props>("/users/me/update", props);
  }

  static async searchUsers(query: string) {
    return await get<PaginatedPayload<UserProfile>>(`/users/?search=${query}`);
  }
}

export default ProfileApi;
