import { NextRequest, NextResponse } from "next/server";

import ServerAuthApi from "@/services/api/auth/auth.server";
import {
  ACCESS_TOKEN_EXPIRY_SECONDS,
  COOKIE_NAME_ACCESS_TOKEN,
  COOKIE_NAME_REFRESH_TOKEN,
  isTokenExpired,
  REFRESH_TOKEN_EXPIRY_SECONDS,
} from "@/services/auth_tokens";
import {
  LanguageService,
  LOCALE_COOKIE_NAME,
} from "@/services/language_service";
import { getAlphaTokenSession } from "@/services/session";
import { getAlphaAccessToken } from "@/utils/alpha_access";
import { getPublicSettings } from "@/utils/public_settings.server";

function hasAuthSession(request: NextRequest): boolean {
  const accessToken = request.cookies.get(COOKIE_NAME_ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAME_REFRESH_TOKEN)?.value;
  return !!(accessToken || refreshToken);
}

/**
 * Refresh tokens and apply new cookies to response
 */
async function refreshTokensIfNeeded(
  request: NextRequest,
  response: NextResponse
): Promise<void> {
  const accessToken = request.cookies.get(COOKIE_NAME_ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAME_REFRESH_TOKEN)?.value;

  // No refresh token = can't refresh
  if (!refreshToken) return;

  // Access token still valid = no refresh needed
  if (!isTokenExpired(accessToken)) return;

  let tokens;
  try {
    tokens = await ServerAuthApi.refreshTokens(refreshToken);
  } catch (error) {
    console.error("Middleware token refresh failed:", error);
    return;
  }

  // Set new cookies on the response
  const cookieOpts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  };

  response.cookies.set(COOKIE_NAME_ACCESS_TOKEN, tokens.access, {
    ...cookieOpts,
    maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
  });

  response.cookies.set(COOKIE_NAME_REFRESH_TOKEN, tokens.refresh, {
    ...cookieOpts,
    maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
  });
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasAuthSession(request);

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

  // Proactive token refresh (MUST happen in middleware to persist cookies)
  if (hasSession) {
    await refreshTokensIfNeeded(request, response);
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
