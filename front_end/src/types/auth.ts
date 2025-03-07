import { CurrentUser } from "@/types/users";

export type AuthContextType = {
  user: CurrentUser | null;
  setUser: (user: CurrentUser | null) => void;
};

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

export type SignUpResponse = AuthResponse & {
  is_active: boolean;
  token: string | null;
};
