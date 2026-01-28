/**
 * Legacy Auth Token Migration
 *
 * DEPRECATED: Remove this file after 30 days from release.
 */
import "server-only";

import { NextRequest, NextResponse } from "next/server";

import { AuthCookieManager } from "@/services/auth_tokens";
import { getPublicSettings } from "@/utils/public_settings.server";

const LEGACY_COOKIE_NAME = "auth_token";

/**
 * Migrate legacy auth_token cookie to new JWT tokens.
 * Call this in middleware before normal auth handling.
 * Deletes invalid legacy tokens on 400 response.
 */
export async function handleLegacyTokenMigration(
  request: NextRequest,
  response: NextResponse,
  responseAuth: AuthCookieManager
): Promise<boolean> {
  const legacyToken = request.cookies.get(LEGACY_COOKIE_NAME)?.value;
  if (!legacyToken) return false;

  const { PUBLIC_API_BASE_URL } = getPublicSettings();

  try {
    const apiResponse = await fetch(
      `${PUBLIC_API_BASE_URL}/api/auth/exchange-legacy-token/`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token: legacyToken }),
      }
    );

    if (apiResponse.status === 400) {
      // Invalid token - clean it up
      response.cookies.delete(LEGACY_COOKIE_NAME);
      return false;
    }

    if (!apiResponse.ok) return false;

    const data = await apiResponse.json();
    responseAuth.setAuthTokens(data.tokens);
    return true;
  } catch {
    return false;
  }
}
