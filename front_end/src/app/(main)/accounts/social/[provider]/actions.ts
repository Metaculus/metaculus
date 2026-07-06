"use server";

import ServerAuthApi from "@/services/api/auth/auth.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { getCsrfManager } from "@/services/csrf";
import { SocialProviderType } from "@/types/auth";
import { getPublicSettings } from "@/utils/public_settings.server";

export async function exchangeSocialOauthCode(
  provider: SocialProviderType,
  code: string,
  nonce: string
) {
  const csrfManager = await getCsrfManager();
  try {
    csrfManager.verify(nonce);
  } finally {
    csrfManager.rotate();
  }

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
