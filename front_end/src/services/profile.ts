import { getServerSession } from "@/services/session";
import { CurrentUser } from "@/types/users";
import { get } from "@/utils/fetch";

class ProfileApi {
  static async getMyProfile(): Promise<CurrentUser | null> {
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
}

export default ProfileApi;
