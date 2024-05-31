import { CurrentUser } from "@/types/users";

export type SocialAuthResponse = {
  token: string;
};

export type SocialProviderType = "facebook" | "google-oauth2";

export type SocialProvider = {
  name: SocialProviderType;
  auth_url: string;
};

export type AuthResponse = {
  token: string;
  user: CurrentUser;
};
