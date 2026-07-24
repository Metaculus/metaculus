import { NextRequest, NextResponse } from "next/server";

import { AUTOTRANSLATION_HEADER } from "@/constants/experiments";
import ServerAuthApi from "@/services/api/auth/auth.server";
import { AuthCookieManager, AuthCookieReader } from "@/services/auth_tokens";
import {
  getAutotranslationEnrollment,
  setAssignmentCookieInResponse,
} from "@/services/autotranslation_experiment";
import { CsrfManager } from "@/services/csrf";
import {
  LanguageService,
  LOCALE_COOKIE_NAME,
} from "@/services/language_service";
import { getAlphaTokenSession } from "@/services/session";
import { getAlphaAccessToken } from "@/utils/alpha_access";
import { ApiError } from "@/utils/core/errors";
import { applyCspHeaders, buildCsp } from "@/utils/csp";
import { getPublicSettings } from "@/utils/public_settings.server";

/**
 * Returns true on 4xx (definitive client error), false otherwise.
 * Used to determine if we should clear tokens or preserve them on transient errors.
 */
function isClientError(error: unknown): boolean {
  return ApiError.isApiError(error) && error.response.status < 500;
}

/**
 * Refresh tokens using refresh token.
 * Returns true if refreshed, false on 4xx.
 * Throws on transient errors (5xx, network).
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
    if (isClientError(error)) {
      console.error("Middleware token refresh failed", error);
      return false;
    }
    throw error;
  }
}

/**
 * Verify access token is valid.
 * Returns true if valid, false on 4xx.
 * Throws on transient errors (5xx, network).
 */
async function verifyToken(): Promise<boolean> {
  try {
    await ServerAuthApi.verifyToken();
    return true;
  } catch (error) {
    if (isClientError(error)) {
      console.error("Token verification failed", error);
      return false;
    }
    throw error;
  }
}

function shouldSkipCspHeaders(request: NextRequest): boolean {
  const purpose = request.headers.get("purpose");
  const secPurpose = request.headers.get("sec-purpose");

  return (
    request.nextUrl.searchParams.has("_rsc") ||
    request.headers.get("rsc") === "1" ||
    request.headers.has("next-router-prefetch") ||
    purpose === "prefetch" ||
    secPurpose?.includes("prefetch") === true
  );
}

export async function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const requestAuth = new AuthCookieReader(request.cookies);

  const requestHeaders = new Headers(request.headers);
  requestHeaders.set("x-url", request.url);

  const shouldApplyCsp = !shouldSkipCspHeaders(request);
  const nonce = shouldApplyCsp ? btoa(crypto.randomUUID()) : null;
  const cspHeader = nonce ? buildCsp(nonce) : null;

  if (cspHeader && nonce) {
    requestHeaders.set("x-nonce", nonce);
    // Next.js reads the nonce from this request header to tag its own scripts
    // (next/script, framework chunks) - it checks the report-only variant too
    requestHeaders.set("Content-Security-Policy-Report-Only", cspHeader);
  }

  // Auto-translation A/B experiment: enroll eligible anonymous visitors.
  // The header lets getLocale() apply the variant on this same request
  const autotranslationEnrollment = await getAutotranslationEnrollment(
    request,
    requestAuth,
    shouldApplyCsp
  );
  if (autotranslationEnrollment) {
    requestHeaders.set(
      AUTOTRANSLATION_HEADER,
      autotranslationEnrollment.variant
    );
  } else {
    // Never trust a client-supplied variant header
    requestHeaders.delete(AUTOTRANSLATION_HEADER);
  }

  const response = NextResponse.next({ request: { headers: requestHeaders } });
  if (cspHeader) {
    applyCspHeaders(response, cspHeader);
  }
  const responseAuth = new AuthCookieManager(response.cookies);

  if (autotranslationEnrollment) {
    setAssignmentCookieInResponse(response, autotranslationEnrollment);
  }

  let hasSession = false;
  const accessToken = requestAuth.getAccessToken();
  const refreshToken = requestAuth.getRefreshToken();

  try {
    // 1. Verify non-expired access token
    if (accessToken && !requestAuth.isAccessTokenExpired()) {
      hasSession = await verifyToken();
    }

    // 2. Try refresh if no valid session yet
    if (!hasSession && refreshToken) {
      hasSession = await refreshTokens(requestAuth, responseAuth);
    }

    // 3. Clear invalid JWT tokens (only on definitive 4xx, not transient errors)
    if (!hasSession && (accessToken || refreshToken)) {
      responseAuth.clearAuthTokens();
    }
  } catch (error) {
    // Transient error (5xx, network) - don't clear tokens
    console.error("Auth service error, preserving tokens:", error);
  }

  const { PUBLIC_AUTHENTICATION_REQUIRED } = getPublicSettings();

  // If authentication is required, redirect unauthenticated users
  if (PUBLIC_AUTHENTICATION_REQUIRED) {
    if (
      !pathname.startsWith("/not-found/") &&
      !pathname.startsWith("/accounts/") &&
      !hasSession
    ) {
      const rewriteResponse = NextResponse.rewrite(
        new URL("/not-found/", request.url),
        { request: { headers: requestHeaders } }
      );
      if (cspHeader) {
        applyCspHeaders(rewriteResponse, cspHeader);
      }
      response.cookies.getAll().forEach((cookie) => {
        rewriteResponse.cookies.set(cookie);
      });
      return rewriteResponse;
    }
  }

  // Redirect logged-in users from storefront to question feed
  if (pathname === "/" && hasSession) {
    return NextResponse.redirect(new URL("/questions/", request.url));
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

  // Generate CSRF token if not present
  const csrfManager = new CsrfManager(response.cookies);
  csrfManager.generate(request.cookies);

  return response;
}

export const config = {
  matcher: [
    {
      // Run for pages only
      // Ignores prefetch requests, all media files
      // And embedded urls
      source:
        "/((?!api|_next/static|_next/image|favicon.ico|sitemap.xml|robots.txt|csp-report|questions/embed|experiments/embed|opengraph-image-|twitter-image-|app-version|.*\\..*).*)",
      missing: [
        { type: "header", key: "next-router-prefetch" },
        { type: "header", key: "purpose", value: "prefetch" },
      ],
    },
  ],
};
