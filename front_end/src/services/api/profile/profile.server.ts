import "server-only";
import { getServerSession } from "@/services/session";
import { SubscriptionEmailType } from "@/types/notifications";
import { ProfilePreferencesType } from "@/types/preferences";
import { CurrentUser } from "@/types/users";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

import ProfileApi from "./profile.shared";

class ServerProfileApiClass extends ProfileApi {
  // We make getMyProfile server-only, as it depends on the session
  // On client side, we can access user profile using `useAuth` hook
  async getMyProfile(): Promise<CurrentUser | null> {
    const token = await getServerSession();

    if (!token) {
      return null;
    }

    return await this.get<CurrentUser>("/users/me/");
  }

  async markUserAsSpam(id: number): Promise<Response | null> {
    return this.post(`/users/${id}/mark-as-spam/`, {});
  }

  async changeUsername(username: string) {
    return this.post<CurrentUser, { username: string }>(
      "/users/change-username/",
      {
        username,
      }
    );
  }

  async updateProfile(props: {
    bio?: string;
    website?: string;
    unsubscribed_mailing_tags?: SubscriptionEmailType[];
    unsubscribed_preference_tags?: ProfilePreferencesType[];
    is_onboarding_complete?: boolean;
  }) {
    return await this.patch<CurrentUser, typeof props>(
      "/users/me/update/",
      props
    );
  }

  async changePassword(password: string, new_password: string) {
    return this.post("/users/me/password/", {
      password,
      new_password,
    });
  }

  async changeEmail(email: string, password: string) {
    return this.post("/users/me/email/", {
      email,
      password,
    });
  }

  async changeEmailConfirm(token: string) {
    return this.post("/users/me/email/confirm/", {
      token,
    });
  }

  async registerUserCampaign(
    key: string,
    details: object,
    add_to_project?: number
  ) {
    return this.post<void>("/users/me/register_campaign/", {
      key,
      details,
      add_to_project,
    });
  }
}

const ServerProfileApi = new ServerProfileApiClass(serverFetcher);
export default ServerProfileApi;
