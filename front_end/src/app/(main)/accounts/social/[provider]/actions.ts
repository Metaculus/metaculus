"use server";

import ServerAuthApi from "@/services/api/auth/auth.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { SocialProviderType } from "@/types/auth";
import { getPublicSettings } from "@/utils/public_settings.server";

export async function exchangeSocialOauthCode(
  provider: SocialProviderType,
  code: string
) {
  const { PUBLIC_APP_URL } = getPublicSettings();
  const response = await ServerAuthApi.exchangeSocialOauthCode(
    provider,
    code,
    `${PUBLIC_APP_URL}/accounts/social/${provider}`
  );

  if (response?.tokens) {
    const authManager = await getAuthCookieManager();
    authManager.setAuthTokens(response.tokens);
  }
}
