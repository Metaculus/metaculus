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
        `/auth/social?redirect_uri=${redirect_uri}`
      );
    } catch (err) {
      console.error("Error getting social providers:", err);
      return [];
    }
  }

  static async exchangeSocialOauthCode(
    provider: SocialProviderType,
    code: string,
    redirect_uri: string
  ): Promise<SocialAuthResponse | null> {
    try {
      return await post<
        SocialAuthResponse,
        { code: string; redirect_uri: string }
      >(`/auth/social/${provider}/`, {
        code,
        redirect_uri,
      });
    } catch (err) {
      console.error("Error getting social providers:", err);
      return null;
    }
  }

  static async signIn(login: string, password: string) {
    return post<AuthResponse, { login: string; password: string }>(
      "/auth/login/token",
      { login, password }
    );
  }

  static async signUp(email: string, username: string, password: string) {
    return post<
      AuthResponse,
      { email: string; username: string; password: string }
    >("/auth/signup", { email, username, password });
  }
}

export default AuthApi;
