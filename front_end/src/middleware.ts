import { NextRequest, NextResponse } from "next/server";

import ServerAuthApi from "@/services/api/auth/auth.server";
import { AuthCookieManager, AuthCookieReader } from "@/services/auth_tokens";
import {
  LanguageService,
  LOCALE_COOKIE_NAME,
} from "@/services/language_service";
import { getAlphaTokenSession } from "@/services/session";
import { getAlphaAccessToken } from "@/utils/alpha_access";
import { getPublicSettings } from "@/utils/public_settings.server";

async function verifyToken(responseAuth: AuthCookieManager): Promise<void> {
  try {
    await ServerAuthApi.verifyToken();
  } catch {
    // Token is invalid (user banned, token revoked, etc.) - clear all auth cookies
    console.error("Token verification failed, clearing auth cookies");
    responseAuth.clearAuthTokens();
  }
}

/**
 * Refresh tokens and apply new cookies to response.
 * Returns true if tokens were refreshed.
 */
async function refreshTokensIfNeeded(
  requestAuth: AuthCookieReader,
  responseAuth: AuthCookieManager
): Promise<boolean> {
  const refreshToken = requestAuth.getRefreshToken();

  // No refresh token = can't refresh
  if (!refreshToken) return false;

  // Access token still valid = no refresh needed
  if (!requestAuth.isAccessTokenExpired()) return false;

  let tokens;
  try {
    tokens = await ServerAuthApi.refreshTokens(refreshToken);
  } catch (error) {
    console.error("Middleware token refresh failed:", error);
    return false;
  }

  responseAuth.setAuthTokens(tokens);
  return true;
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestAuth = new AuthCookieReader(request.cookies);
  const hasSession = requestAuth.hasAuthSession();

  const { PUBLIC_AUTHENTICATION_REQUIRED } = getPublicSettings();

  // If authentication is required, redirect unauthenticated users
  if (PUBLIC_AUTHENTICATION_REQUIRED) {
    if (
      !pathname.startsWith("/not-found/") &&
      !pathname.startsWith("/accounts/") &&
      !hasSession
    ) {
      // return a not found page
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

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", request.url);

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  const responseAuth = new AuthCookieManager(response.cookies);

  // Proactive token refresh (MUST happen in middleware to persist cookies)
  if (hasSession) {
    const tokensRefreshed = await refreshTokensIfNeeded(
      requestAuth,
      responseAuth
    );
    // Skip verification if tokens were just refreshed (they're valid by definition)
    // Only verify existing tokens to catch banned users or revoked tokens
    if (!tokensRefreshed) {
      await verifyToken(responseAuth);
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
