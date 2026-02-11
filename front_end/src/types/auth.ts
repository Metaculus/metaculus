import { CurrentUser } from "@/types/users";

export type AuthContextType = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
  csrfToken?: string | null;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type SocialAuthResponse = {
  tokens: AuthTokens;
};

export type SocialProviderType = "facebook" | "google-oauth2";

export type SocialProvider = {
  name: SocialProviderType;
  auth_url: string;
};

export type AuthResponse = {
  tokens: AuthTokens;
  user: CurrentUser;
};

export type SignUpResponse = {
  tokens: AuthTokens | null;
  user: CurrentUser;
  is_active: boolean;
};
