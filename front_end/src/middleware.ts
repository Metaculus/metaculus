import { NextRequest, NextResponse } from "next/server";

import ServerAuthApi from "@/services/api/auth/auth.server";
import {
  COOKIE_NAME_ACCESS_TOKEN,
  COOKIE_NAME_REFRESH_TOKEN,
} from "@/services/auth_tokens";
import {
  LanguageService,
  LOCALE_COOKIE_NAME,
} from "@/services/language_service";
import { getAlphaTokenSession } from "@/services/session";
import { getAlphaAccessToken } from "@/utils/alpha_access";
import { ApiError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

function hasAuthSession(request: NextRequest): boolean {
  const accessToken = request.cookies.get(COOKIE_NAME_ACCESS_TOKEN)?.value;
  const refreshToken = request.cookies.get(COOKIE_NAME_REFRESH_TOKEN)?.value;
  return !!(accessToken || refreshToken);
}

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const hasSession = hasAuthSession(request);

  const { PUBLIC_AUTHENTICATION_REQUIRED } = getPublicSettings();
  // if authentication is required, check for token
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

  let clearAuthCookies = false;

  if (hasSession) {
    try {
      await ServerAuthApi.verifyToken();
    } catch (error) {
      if ((error as ApiError)?.response?.status === 403) {
        request.cookies.delete(COOKIE_NAME_ACCESS_TOKEN);
        request.cookies.delete(COOKIE_NAME_REFRESH_TOKEN);
        clearAuthCookies = true;
      }
    }

    // Check restricted access token
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

  const locale_in_url = request.nextUrl.searchParams.get("locale");
  const locale_in_cookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;
  if (locale_in_url && locale_in_url !== locale_in_cookie) {
    LanguageService.setLocaleCookieInResponse(response, locale_in_url);
  }

  if (clearAuthCookies) {
    response.cookies.delete(COOKIE_NAME_ACCESS_TOKEN);
    response.cookies.delete(COOKIE_NAME_REFRESH_TOKEN);
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
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|questions/embed|experiments/embed|opengraph-image-|twitter-image-|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
