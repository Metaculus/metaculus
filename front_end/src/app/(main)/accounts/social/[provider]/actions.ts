"use server";

import { cookies } from "next/headers";

import ServerAuthApi from "@/services/api/auth/auth.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { SocialProviderType } from "@/types/auth";
import { GatedActionInput } from "@/types/gated_actions";
import { assertValidCsrfNonce, CSRF_COOKIE_NAME } from "@/utils/csrf";
import {
  EMAIL_CAPTURE_SIGNUP_SOURCE,
  mapGatedActionToWire,
} from "@/utils/gated_actions";
import { getPublicSettings } from "@/utils/public_settings.server";

export async function exchangeSocialOauthCode(
  provider: SocialProviderType,
  code: string,
  nonce: string,
  gatedAction?: GatedActionInput | null,
  fromEmailCapture = false
) {
  const cookieStore = await cookies();
  assertValidCsrfNonce(cookieStore.get(CSRF_COOKIE_NAME)?.value, nonce);

  const { PUBLIC_APP_URL } = getPublicSettings();
  const response = await ServerAuthApi.exchangeSocialOauthCode(
    provider,
    code,
    `${PUBLIC_APP_URL}/accounts/social/${provider}`,
    gatedAction ? mapGatedActionToWire(gatedAction) : null,
    fromEmailCapture ? EMAIL_CAPTURE_SIGNUP_SOURCE : null
  );

  if (response?.tokens) {
    const authManager = await getAuthCookieManager();
    authManager.setAuthTokens(response.tokens);
  }
}
