import { get } from "@/utils/fetch";
import { CurrentUser } from "@/types/users";
import { getServerSession } from "@/services/session";

class ProfileApi {
  static async getMyProfile(): Promise<CurrentUser | null> {
    console.log(`Token ${JSON.stringify(getServerSession())}`)

    try {
      return await get<CurrentUser>("/users/me", {
        headers: {
          Authorization: `Token ${getServerSession()}`,
        },
      });
    } catch (err) {
      console.error("Error getting current user:", err);
      return null;
    }
  }
}

export default ProfileApi;
