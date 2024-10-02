import { NextRequest, NextResponse } from "next/server";

import AuthApi from "@/services/auth";
import {
  COOKIE_NAME_TOKEN,
  getAlphaTokenSession,
  getServerSession,
} from "@/services/session";
import { ErrorResponse } from "@/types/fetch";
import { getAlphaAccessToken } from "@/utils/alpha_access";

export async function middleware(request: NextRequest) {
  const isEmbeddingRequest =
    Boolean(request.headers.get("image-preview-request")) ||
    request.nextUrl.pathname.includes("/api/posts/preview-image/") ||
    request.nextUrl.pathname.includes("/questions/embed/") ||
    request.nextUrl.pathname.includes("/experiments/embed/") ||
    request.nextUrl.pathname.includes("/opengraph-image-") ||
    request.nextUrl.pathname.includes("/twitter-image-");
  let deleteCookieToken = false;

  // Run for pages only
  if (
    request.nextUrl.pathname.match("/((?!static|.*\\..*|_next).*)") &&
    !isEmbeddingRequest
  ) {
    const serverSession = getServerSession();

    if (serverSession) {
      // Verify auth token
      try {
        await AuthApi.verifyToken();
      } catch (error) {
        const errorResponse = error as ErrorResponse;

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
    }

    // Check restricted access token
    const alphaAccessToken = await getAlphaAccessToken();
    const alphaAuthUrl = "/alpha-auth";

    if (
      alphaAccessToken &&
      getAlphaTokenSession() !== alphaAccessToken &&
      !request.nextUrl.pathname.startsWith(alphaAuthUrl)
    ) {
      return NextResponse.redirect(new URL(alphaAuthUrl, request.url));
    }
  }

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", request.url);

  const locale_in_url = request.nextUrl.searchParams.get("locale");
  const local_in_cookie = request.cookies.get("NEXT_LOCALE")?.value;

  const response = NextResponse.next({
    request: {
      headers: requestHeaders,
    },
  });

  if (locale_in_url && locale_in_url !== local_in_cookie) {
    response.cookies.set("NEXT_LOCALE", locale_in_url, {
      maxAge: 60 * 60 * 24 * 365, // 1 year in seconds
    });
  }

  if (deleteCookieToken) {
    response.cookies.delete(COOKIE_NAME_TOKEN);
  }

  return response;
}
