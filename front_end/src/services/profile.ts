import { getServerSession } from "@/services/session";
import { PaginatedPayload } from "@/types/fetch";
import { SubscriptionEmailType } from "@/types/notifications";
import { ProfilePreferencesType } from "@/types/preferences";
import { CurrentUser, UserProfile } from "@/types/users";
import { get, patch, post } from "@/utils/fetch";

class ProfileApi {
  static async getMyProfile(): Promise<CurrentUser | null> {
    const token = await getServerSession();

    if (!token) {
      return null;
    }

    return await get<CurrentUser>("/users/me/");
  }

  static async markUserAsSpam(id: number): Promise<Response | null> {
    return post(`/users/${id}/mark-as-spam/`, {});
  }

  static async getProfileById(id: number): Promise<CurrentUser> {
    return await get<CurrentUser>(`/users/${id}/`);
  }

  static async changeUsername(username: string) {
    return post<CurrentUser, { username: string }>("/users/change-username/", {
      username,
    });
  }

  static async updateProfile(props: {
    bio?: string;
    website?: string;
    unsubscribed_mailing_tags?: SubscriptionEmailType[];
    unsubscribed_preference_tags?: ProfilePreferencesType[];
    is_onboarding_complete?: boolean;
  }) {
    const response = await patch<CurrentUser, typeof props>(
      "/users/me/update/",
      props
    );
    return response;
  }

  static async changePassword(password: string, new_password: string) {
    return post("/users/me/password/", {
      password,
      new_password,
    });
  }

  static async changeEmail(email: string, password: string) {
    return post("/users/me/email/", {
      email,
      password,
    });
  }

  static async changeEmailConfirm(token: string) {
    return post("/users/me/email/confirm/", {
      token,
    });
  }

  static async searchUsers(query: string) {
    return await get<PaginatedPayload<UserProfile>>(`/users/?search=${query}`);
  }

  static async registerUserCampaign(
    key: string,
    details: object,
    add_to_project?: number
  ) {
    return post<void>("/users/me/register_campaign/", {
      key,
      details,
      add_to_project,
    });
  }
}

export default ProfileApi;
