import { getServerSession } from "@/services/session";
import { CurrentUser } from "@/types/users";
import { get } from "@/utils/fetch";

class ProfileApi {
  static async getMyProfile(): Promise<CurrentUser | null> {
    console.log(`Token ${JSON.stringify(getServerSession())}`);

    const token = getServerSession();

    if (!token) {
      return null;
    }

    try {
      return await get<CurrentUser>("/users/me", {
        headers: {
          Authorization: `Token ${token}`,
        },
      });
    } catch (err) {
      console.error("Error getting current user:", err);
      return null;
    }
  }
}

export default ProfileApi;
