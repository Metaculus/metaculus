import { CurrentUser } from "@/types/users";

export type AuthContextType = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
};

type AuthTokenCredentials = {
  access_token: string;
  refresh_token: string;
};

export type SocialAuthResponse = AuthTokenCredentials;

export type SocialProviderType = "facebook" | "google-oauth2";

export type SocialProvider = {
  name: SocialProviderType;
  auth_url: string;
};

export type AuthResponse = AuthTokenCredentials & {
  user: CurrentUser;
};

export type SignUpResponse = AuthTokenCredentials & {
  user: CurrentUser;
  is_active: boolean;
};
