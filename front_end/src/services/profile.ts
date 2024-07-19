import { getServerSession } from "@/services/session";
import { PaginatedPayload } from "@/types/fetch";
import { CurrentUser, UserProfile } from "@/types/users";
import { get, handleRequestError, patch, post } from "@/utils/fetch";

class ProfileApi {
  static async getMyProfile(): Promise<CurrentUser | null> {
    const token = getServerSession();

    if (!token) {
      return null;
    }

    try {
      return await get<CurrentUser>("/users/me");
    } catch (err) {
      return handleRequestError(err, () => {
        console.error("Error getting current user:", err);
        return null;
      });
    }
  }

  static async getProfileById(id: number): Promise<CurrentUser> {
    try {
      return await get<CurrentUser>(`/users/${id}`);
    } catch (err) {
      return handleRequestError(err, () => {
        console.error("Error getting user profile:", err);
        return null;
      });
    }
  }

  static async changeUsername(username: string) {
    return post<CurrentUser, { username: string }>("/users/change-username", {
      username,
    });
  }

  static async updateProfile(props: { bio?: string; website?: string }) {
    return patch<CurrentUser, typeof props>("/users/me/update", props);
  }

  static async searchUsers(query: string) {
    return await get<PaginatedPayload<UserProfile>>(`/users/?search=${query}`);
  }
}

export default ProfileApi;
