import "server-only";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { AuthTokens } from "@/types/auth";
import { SubscriptionEmailType } from "@/types/notifications";
import { ProfilePreferencesType } from "@/types/preferences";
import { CurrentBot, CurrentUser } from "@/types/users";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

import ProfileApi from "./profile.shared";

type CreateBotRequest = {
  username: string;
};

type CreatBotResponse = {
  user: CurrentBot;
  token: string;
};

type UpdateProfileRequest = {
  bio?: string;
  website?: string;
  unsubscribed_mailing_tags?: SubscriptionEmailType[];
  unsubscribed_preference_tags?: ProfilePreferencesType[];
  is_onboarding_complete?: boolean;
  language?: string | null;
};

type UpdateBotRequest = {
  username?: string;
  bio?: string;
  website?: string;
};

class ServerProfileApiClass extends ProfileApi {
  // We make getMyProfile server-only, as it depends on the session
  // On client side, we can access user profile using `useAuth` hook
  async getMyProfile(): Promise<CurrentUser | null> {
    const authManager = await getAuthCookieManager();

    if (!authManager.hasAuthSession()) {
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

  async updateProfile(props: UpdateProfileRequest) {
    return await this.patch<CurrentUser, typeof props>(
      "/users/me/update/",
      props
    );
  }

  async changePassword(password: string, new_password: string) {
    return this.post<AuthTokens>("/users/me/password/", {
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

  async emailMeMyData() {
    return this.post("/users/me/email_me_my_data/", {});
  }

  async changeEmailConfirm(token: string) {
    return this.post<AuthTokens>("/users/me/email/confirm/", {
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

  async createBot(data: CreateBotRequest) {
    return this.post<CreatBotResponse>("/users/me/bots/create/", data);
  }

  async updateBot(botId: number, props: UpdateBotRequest) {
    return await this.patch<CurrentBot, typeof props>(
      `/users/me/bots/${botId}/update/`,
      props
    );
  }

  async getBotToken(botId: number) {
    return await this.get<{ token: string }>(`/users/me/bots/${botId}/token/`);
  }

  async getBotJwt(botId: number) {
    return await this.post<AuthTokens>(`/users/me/bots/${botId}/jwt/`, {});
  }
}

const ServerProfileApi = new ServerProfileApiClass(serverFetcher);
export default ServerProfileApi;
