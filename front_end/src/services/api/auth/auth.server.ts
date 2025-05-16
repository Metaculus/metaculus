import "server-only";
import { ApiService } from "@/services/api/api_service";
import {
  AuthResponse,
  SignUpResponse,
  SocialAuthResponse,
  SocialProvider,
  SocialProviderType,
} from "@/types/auth";
import { serverFetcher } from "@/utils/core/fetch/fetch.server";

export type SignUpProps = {
  email: string;
  username: string;
  password: string;
  is_bot: boolean;
  add_to_project?: number;
  campaign_key?: string;
  campaign_data?: object;
  redirect_url?: string;
  invite_token?: string;
};

class ServerAuthApiClass extends ApiService {
  async getSocialProviders(redirect_uri: string): Promise<SocialProvider[]> {
    try {
      return await this.get<SocialProvider[]>(
        `/auth/social/?redirect_uri=${redirect_uri}`,
        {
          next: {
            revalidate: 3600,
          },
        }
      );
    } catch (err) {
      console.error("Error getting social providers:", err);
      return [];
    }
  }

  async verifyToken() {
    return this.get("/auth/verify_token/", {}, { includeLocale: false });
  }

  async exchangeSocialOauthCode(
    provider: SocialProviderType,
    code: string,
    redirect_uri: string
  ): Promise<SocialAuthResponse | null> {
    return this.post<
      SocialAuthResponse,
      { code: string; redirect_uri: string }
    >(`/auth/social/${provider}/`, {
      code,
      redirect_uri,
    });
  }

  async resendActivationEmail(login: string, redirect_url: string) {
    return this.post<AuthResponse, { login: string; redirect_url: string }>(
      "/auth/signup/resend/",
      {
        login,
        redirect_url,
      }
    );
  }

  async signIn(login: string, password: string) {
    return this.post<AuthResponse, { login: string; password: string }>(
      "/auth/login/token/",
      { login, password }
    );
  }

  async signUp(props: SignUpProps, turnstileHeaders: HeadersInit) {
    return this.post<SignUpResponse, SignUpProps>("/auth/signup/", props, {
      headers: turnstileHeaders,
    });
  }

  async activateAccount(userId: string, token: string) {
    return this.post<AuthResponse, { user_id: string; token: string }>(
      "/auth/signup/activate/",
      { user_id: userId, token }
    );
  }

  async passwordResetRequest(login: string) {
    return this.post<null, { login: string }>("/auth/password-reset/", {
      login,
    });
  }

  async passwordResetVerifyToken(user_id: number, token: string) {
    return this.get<null>(
      `/auth/password-reset/change/?user_id=${user_id}&token=${token}`
    );
  }

  async passwordResetConfirm(
    user_id: number,
    token: string,
    password: string
  ): Promise<AuthResponse> {
    return this.post<AuthResponse>(
      `/auth/password-reset/change/?user_id=${user_id}&token=${token}`,
      {
        password,
      }
    );
  }

  async inviteUsers(emails: string[]) {
    return this.post(`/auth/invite/`, {
      emails,
    });
  }
}

const ServerAuthApi = new ServerAuthApiClass(serverFetcher);
export default ServerAuthApi;
