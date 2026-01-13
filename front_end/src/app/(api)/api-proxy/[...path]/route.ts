import { NextRequest, NextResponse } from "next/server";
import { getLocale } from "next-intl/server";

import { refreshWithSingleFlight } from "@/services/auth_refresh";
import {
  AuthCookieManager,
  AuthTokens,
  getAuthCookieManager,
} from "@/services/auth_tokens";
import { getAlphaTokenSession } from "@/services/session";
import { getPublicSettings } from "@/utils/public_settings.server";

export async function GET(request: NextRequest) {
  return handleProxyRequest(request, "GET");
}

/*
 * We expect to use server actions for executing mutations
 * Uncomment and ensure `handleProxyRequest` works well if you need to do regular network request instead
 */
// export async function POST(request: NextRequest) {
//   return handleProxyRequest(request, "POST");
// }
// export async function PUT(request: NextRequest) {
//   return handleProxyRequest(request, "PUT");
// }
// export async function PATCH(request: NextRequest) {
//   return handleProxyRequest(request, "PATCH");
// }
// export async function DELETE(request: NextRequest) {
//   return handleProxyRequest(request, "DELETE");
// }

async function handleProxyRequest(request: NextRequest, method: string) {
  const { PUBLIC_API_BASE_URL, PUBLIC_AUTHENTICATION_REQUIRED } =
    getPublicSettings();

  const emptyContentType = request.headers.get("x-empty-content") === "true";
  const passAuthHeader = request.headers.get("x-pass-auth") !== "false";
  const includeLocale = request.headers.get("x-include-locale") !== "false";

  const shouldPassAuth = passAuthHeader || PUBLIC_AUTHENTICATION_REQUIRED;
  const authManager = await getAuthCookieManager();
  const alphaToken = await getAlphaTokenSession();
  const locale = includeLocale ? await getLocale() : "en";

  const url = new URL(request.url);
  const apiPath = url.pathname.replace("/api-proxy/", "/api/");
  const targetUrl = `${PUBLIC_API_BASE_URL}${apiPath}${url.search}`;

  const blocklistHeaders = [
    "cookie", // properly pass user session to Django API from proxy endpoint
    "host", // ensure paginated requests return proper url in next and prev properties
    "connection", // unsupported header,
    "referer",
    "x-forwarded-for",
    "x-forwarded-host",
    "x-forwarded-port",
    "x-forwarded-proto",

    // custom headers used to apply the same logic as on server fetcher
    "x-empty-content",
    "x-pass-auth",
    "x-include-locale",
  ];

  const buildHeaders = (accessToken?: string): Headers => {
    const headers: HeadersInit = new Headers({
      ...Object.fromEntries(
        Array.from(request.headers.entries()).filter(
          ([key]) => !blocklistHeaders.includes(key.toLowerCase())
        )
      ),
    });

    headers.set("Accept", "application/json");
    headers.set("Accept-Language", locale);
    if (emptyContentType) headers.delete("Content-Type");

    const token =
      accessToken ?? (shouldPassAuth ? authManager.getAccessToken() : null);
    if (token) headers.set("Authorization", `Bearer ${token}`);
    if (alphaToken) headers.set("x-alpha-auth-token", alphaToken);

    return headers;
  };

  let refreshedTokens: AuthTokens | null = null;

  // Proactive refresh: check expiration before making request
  if (shouldPassAuth && authManager.isAccessTokenExpired()) {
    const refreshToken = authManager.getRefreshToken();
    if (refreshToken) {
      const newTokens = await refreshWithSingleFlight(refreshToken);
      if (newTokens) {
        refreshedTokens = newTokens;
      }
    }
  }

  let headers = buildHeaders(refreshedTokens?.access);
  let response = await fetch(targetUrl, { method, headers });

  // Fallback: retry on 401 (in case proactive check missed edge cases)
  if (response.status === 401 && shouldPassAuth) {
    const refreshToken = authManager.getRefreshToken();
    if (refreshToken) {
      const newTokens = await refreshWithSingleFlight(refreshToken);
      if (newTokens) {
        refreshedTokens = newTokens;
        headers = buildHeaders(newTokens.access);
        response = await fetch(targetUrl, { method, headers });
      }
    }
  }

  const responseData = await response.blob();
  const responseHeaders: HeadersInit = {};
  response.headers.forEach((value, key) => {
    const lowerKey = key.toLowerCase();

    if (lowerKey === "content-disposition") {
      responseHeaders[lowerKey] = processContentDispositionHeader(value);
    } else {
      responseHeaders[lowerKey] = value;
    }
  });

  const nextResponse = new NextResponse(responseData, {
    status: response.status,
    statusText: response.statusText,
    headers: responseHeaders,
  });

  if (refreshedTokens) {
    new AuthCookieManager(nextResponse.cookies).setAuthTokens(refreshedTokens);
  }

  return nextResponse;
}

// Normalize the Content-Disposition header to ensure the filename is quoted correctly
// Otherwise we'll get net::ERR_RESPONSE_HEADERS_MULTIPLE_CONTENT_DISPOSITION error if filename includes commas
function processContentDispositionHeader(value: string): string {
  const filenameMatch = value.match(/filename(?:\*=.+|=([^;]+))/);

  if (filenameMatch && filenameMatch[1]) {
    let filename = filenameMatch[1].trim();

    if (
      (filename.includes(",") || /[\s;="]/.test(filename)) &&
      !(filename.startsWith('"') && filename.endsWith('"'))
    ) {
      filename = filename.replace(/^["']|["']$/g, "");

      return value.replace(/filename=[^;]+/, `filename="${filename}"`);
    }
  }

  return value;
}
