"use server";

import { cookies } from "next/headers";

import ServerAuthApi from "@/services/api/auth/auth.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { SocialProviderType } from "@/types/auth";
import { assertValidCsrfNonce, CSRF_COOKIE_NAME } from "@/utils/csrf";
import { getPublicSettings } from "@/utils/public_settings.server";

export async function exchangeSocialOauthCode(
  provider: SocialProviderType,
  code: string,
  nonce: string
) {
  const cookieStore = await cookies();
  assertValidCsrfNonce(cookieStore.get(CSRF_COOKIE_NAME)?.value, nonce);

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
