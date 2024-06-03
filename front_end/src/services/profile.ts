import { getServerSession } from "@/services/session";
import { CurrentUser, UserProfile } from "@/types/users";
import { get, post } from "@/utils/fetch";

class ProfileApi {
  static async getMyProfile() {
    const token = getServerSession();

    if (!token) {
      return null;
    }

    try {
      return await get<CurrentUser>("/users/me");
    } catch (err) {
      console.error("Error getting current user:", err);
      return null;
    }
  }

  static async getProfileById(id: number) {
    try {
      return await get<CurrentUser>(`/users/${id}`);
    } catch (err) {
      console.error("Error getting user profile:", err);
      return null;
    }
  }

  static async changeUsername(username: string) {
    return post<CurrentUser, { username: string }>("/users/change-username", {
      username,
    });
  }
}

export default ProfileApi;
