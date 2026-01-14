/**
 * Legacy Auth Token Migration
 *
 * DEPRECATED: Remove this file after 30 days from release.
 */
import "server-only";

import { NextRequest } from "next/server";

import { AuthCookieManager, AuthCookieReader } from "@/services/auth_tokens";
import { getPublicSettings } from "@/utils/public_settings.server";

const LEGACY_COOKIE_NAME = "auth_token";

/**
 * Migrate legacy auth_token cookie to new JWT tokens.
 * Call this in middleware before normal auth handling.
 */
export async function handleLegacyTokenMigration(
  request: NextRequest,
  requestAuth: AuthCookieReader,
  responseAuth: AuthCookieManager
): Promise<boolean> {
  if (requestAuth.hasAuthSession()) return false;

  const legacyToken = request.cookies.get(LEGACY_COOKIE_NAME)?.value;
  if (!legacyToken) return false;

  const { PUBLIC_API_BASE_URL } = getPublicSettings();

  try {
    const response = await fetch(
      `${PUBLIC_API_BASE_URL}/api/auth/exchange-legacy-token/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: legacyToken }),
      }
    );

    if (!response.ok) return false;

    const data = await response.json();
    responseAuth.setAuthTokens(data.tokens);
    return true;
  } catch {
    return false;
  }
}
