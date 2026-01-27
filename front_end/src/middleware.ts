import { NextRequest, NextResponse } from "next/server";

import ServerAuthApi from "@/services/api/auth/auth.server";
import { AuthCookieManager, AuthCookieReader } from "@/services/auth_tokens";
// DEPRECATED: Remove after 30-day migration period
import { handleLegacyTokenMigration } from "@/services/auth_tokens_migration";
import {
  LanguageService,
  LOCALE_COOKIE_NAME,
} from "@/services/language_service";
import { getAlphaTokenSession } from "@/services/session";
import { getAlphaAccessToken } from "@/utils/alpha_access";
import { getPublicSettings } from "@/utils/public_settings.server";

/**
 * Refresh tokens using refresh token.
 * Returns true if tokens were refreshed.
 */
async function refreshTokens(
  requestAuth: AuthCookieReader,
  responseAuth: AuthCookieManager
): Promise<boolean> {
  const refreshToken = requestAuth.getRefreshToken();
  if (!refreshToken) return false;

  try {
    const tokens = await ServerAuthApi.refreshTokens(refreshToken);
    responseAuth.setAuthTokens(tokens);
    return true;
  } catch (error) {
    console.error("Middleware token refresh failed:", error);
    return false;
  }
}

/**
 * Verify access token is valid.
 * Returns true if valid.
 */
async function verifyToken(): Promise<boolean> {
  try {
    await ServerAuthApi.verifyToken();
    return true;
  } catch {
    console.error("Token verification failed");
    return false;
  }
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestAuth = new AuthCookieReader(request.cookies);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", request.url);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const responseAuth = new AuthCookieManager(response.cookies);

  let hasSession = false;
  const accessToken = requestAuth.getAccessToken();
  const refreshToken = requestAuth.getRefreshToken();

  // 1. Verify non-expired access token
  if (accessToken && !requestAuth.isAccessTokenExpired()) {
    hasSession = await verifyToken();
  }

  // 2. Try refresh if no valid session yet
  if (!hasSession && refreshToken) {
    hasSession = await refreshTokens(requestAuth, responseAuth);
  }

  // 3. Clear invalid JWT tokens
  if (!hasSession && (accessToken || refreshToken)) {
    responseAuth.clearAuthTokens();
    // Clear legacy auth token
    response.cookies.delete("auth_token");
  }

  // 4. No JWT tokens - try legacy migration
  // DEPRECATED: Remove after 30-day migration period
  if (!hasSession && !accessToken && !refreshToken) {
    hasSession = await handleLegacyTokenMigration(
      request,
      response,
      responseAuth
    );
  }

  const { PUBLIC_AUTHENTICATION_REQUIRED } = getPublicSettings();

  // If authentication is required, redirect unauthenticated users
  if (PUBLIC_AUTHENTICATION_REQUIRED) {
    if (
      !pathname.startsWith("/not-found/") &&
      !pathname.startsWith("/accounts/") &&
      !hasSession
    ) {
      return NextResponse.rewrite(new URL("/not-found/", request.url));
    }
  }

  // Check restricted alpha access
  if (hasSession) {
    const alphaAccessToken = await getAlphaAccessToken();
    const alphaAuthUrl = "/alpha-auth";

    if (alphaAccessToken) {
      const alphaTokenSession = await getAlphaTokenSession();

      if (
        alphaTokenSession !== alphaAccessToken &&
        !pathname.startsWith(alphaAuthUrl)
      ) {
        return NextResponse.redirect(new URL(alphaAuthUrl, request.url));
      }
    }
  }

  const locale_in_url = request.nextUrl.searchParams.get("locale");
  const locale_in_cookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (locale_in_url && locale_in_url !== locale_in_cookie) {
    LanguageService.setLocaleCookieInResponse(response, locale_in_url);
  }

  return response;
}

export const config = {
  matcher: [
    {
      // Run for pages only
      // Ignores prefetch requests, all media files
      // And embedded urls
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|questions/embed|experiments/embed|opengraph-image-|twitter-image-|app-version|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
