import { NextRequest, NextResponse } from "next/server";

import ServerAuthApi from "@/services/api/auth/auth.server";
import {
  LanguageService,
  LOCALE_COOKIE_NAME,
} from "@/services/language_service";
import {
  COOKIE_NAME_TOKEN,
  getAlphaTokenSession,
  getServerSession,
} from "@/services/session";
import { getAlphaAccessToken } from "@/utils/alpha_access";
import { ApiError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  const serverSession = await getServerSession();

  const { PUBLIC_AUTHENTICATION_REQUIRED } = getPublicSettings();
  // if authentication is required, check for token
  if (PUBLIC_AUTHENTICATION_REQUIRED) {
    if (
      !request.nextUrl.pathname.startsWith("/not-found/") &&
      !request.nextUrl.pathname.startsWith("/accounts/") &&
      !serverSession
    ) {
      // return a not found page
      return NextResponse.rewrite(new URL("/not-found/", request.url));
    }
  }

  let deleteCookieToken = false;

  if (serverSession) {
    // Verify auth token
    try {
      await ServerAuthApi.verifyToken();
    } catch (error) {
      const errorResponse = error as ApiError;

      if (errorResponse?.response?.status === 403) {
        request.cookies.delete(COOKIE_NAME_TOKEN);
        // A small workaround of deleting cookies.
        // We need to delete cookies from request before generating response
        // to let other services know we've eliminated the auth token.
        // But Nextjs does not apply such cookies deletion to the response
        // automatically, so we have to do it for both req and res
        // https://github.com/vercel/next.js/issues/40146
        deleteCookieToken = true;
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

  const locale_in_url = request.nextUrl.searchParams.get("locale");
  const locale_in_cookie = request.cookies.get(LOCALE_COOKIE_NAME)?.value;

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  // Handle explicit locale parameter in URL
  if (locale_in_url && locale_in_url !== locale_in_cookie) {
    LanguageService.setLocaleCookieInResponse(response, locale_in_url);
  }

  if (deleteCookieToken) {
    response.cookies.delete(COOKIE_NAME_TOKEN);
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
