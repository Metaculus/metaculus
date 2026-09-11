import { CurrentUser } from "@/types/users";

export type AuthContextType = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
};

export type AuthTokens = {
  access: string;
  refresh: string;
};

export type SocialAuthResponse = {
  tokens: AuthTokens;
  /** True only on the request that created the account. */
  is_new: boolean;
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

export type EmailLinkVerifyResponse = AuthResponse & {
  /** True only when this call completed a signup rather than a sign-in. */
  is_new: boolean;
};

export type SignUpResponse = {
  tokens: AuthTokens | null;
  user: CurrentUser;
  is_active: boolean;
};
