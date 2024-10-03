import {
  AuthResponse,
  SocialAuthResponse,
  SocialProvider,
  SocialProviderType,
} from "@/types/auth";
import { get, post } from "@/utils/fetch";

class AuthApi {
  static async getSocialProviders(
    redirect_uri: string
  ): Promise<SocialProvider[]> {
    try {
      return await get<SocialProvider[]>(
        `/auth/social?redirect_uri=${redirect_uri}`,
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

  static async verifyToken() {
    return get("/auth/verify_token");
  }

  static async exchangeSocialOauthCode(
    provider: SocialProviderType,
    code: string,
    redirect_uri: string
  ): Promise<SocialAuthResponse | null> {
    return post<SocialAuthResponse, { code: string; redirect_uri: string }>(
      `/auth/social/${provider}/`,
      {
        code,
        redirect_uri,
      }
    );
  }

  static async signIn(login: string, password: string) {
    return post<AuthResponse, { login: string; password: string }>(
      "/auth/login/token",
      { login, password }
    );
  }

  static async signUp(
    email: string,
    username: string,
    password: string,
    is_bot: boolean,
    turnstileHeaders: Record<string, any>,
    add_to_project?: number
  ) {
    return post<
      null,
      {
        email: string;
        username: string;
        password: string;
        is_bot: boolean;
        add_to_project?: number;
      }
    >(
      "/auth/signup",
      { email, username, password, is_bot, add_to_project },
      { headers: turnstileHeaders }
    );
  }

  static async activateAccount(userId: string, token: string) {
    return post<AuthResponse, { user_id: string; token: string }>(
      "/auth/signup/activate",
      { user_id: userId, token }
    );
  }

  static async passwordResetRequest(login: string) {
    return post<null, { login: string }>("/auth/password-reset", {
      login,
    });
  }

  static async passwordResetVerifyToken(user_id: number, token: string) {
    return get<null>(
      `/auth/password-reset/change?user_id=${user_id}&token=${token}`
    );
  }

  static async passwordResetConfirm(
    user_id: number,
    token: string,
    password: string
  ): Promise<AuthResponse> {
    return post<AuthResponse>(
      `/auth/password-reset/change?user_id=${user_id}&token=${token}`,
      {
        password,
      }
    );
  }
}

export default AuthApi;
