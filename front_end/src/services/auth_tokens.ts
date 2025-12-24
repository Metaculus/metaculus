import "server-only";

import { cookies } from "next/headers";

export const COOKIE_NAME_ACCESS_TOKEN = "metaculus_access_token";
export const COOKIE_NAME_REFRESH_TOKEN = "metaculus_refresh_token";

// Token expiration times (should match backend)
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days

export type AuthTokens = {
  accessToken: string;
  refreshToken: string;
};

/**
 * Set both access and refresh tokens in httpOnly cookies
 */
export async function setAuthTokens(tokens: AuthTokens): Promise<void> {
  const cookieStorage = await cookies();

  cookieStorage.set(COOKIE_NAME_ACCESS_TOKEN, tokens.accessToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
    path: "/",
  });

  cookieStorage.set(COOKIE_NAME_REFRESH_TOKEN, tokens.refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
    path: "/",
  });
}

export async function getAccessToken(): Promise<string | null> {
  const cookieStorage = await cookies();
  return cookieStorage.get(COOKIE_NAME_ACCESS_TOKEN)?.value || null;
}

/**
 * Decode JWT payload without verification (we just need expiration time)
 */
function decodeJWTPayload(token: string): { exp?: number } | null {
  try {
    const [, payload] = token.split(".");
    if (!payload) return null;
    const decoded = Buffer.from(payload, "base64url").toString("utf-8");
    return JSON.parse(decoded);
  } catch {
    return null;
  }
}

/**
 * Check if access token is expired or about to expire
 * @param bufferSeconds - refresh if expiring within this many seconds (default: 30)
 */
export async function isAccessTokenExpired(
  bufferSeconds: number = 30
): Promise<boolean> {
  const token = await getAccessToken();
  if (!token) return true;

  const payload = decodeJWTPayload(token);
  if (!payload?.exp) return false; // Can't determine, assume not expired

  const expiresAt = payload.exp * 1000; // Convert to milliseconds
  const now = Date.now();
  const bufferMs = bufferSeconds * 1000;

  return now >= expiresAt - bufferMs;
}

export async function getRefreshToken(): Promise<string | null> {
  const cookieStorage = await cookies();
  return cookieStorage.get(COOKIE_NAME_REFRESH_TOKEN)?.value || null;
}

export async function clearAuthTokens(): Promise<void> {
  const cookieStorage = await cookies();
  cookieStorage.delete(COOKIE_NAME_ACCESS_TOKEN);
  cookieStorage.delete(COOKIE_NAME_REFRESH_TOKEN);
}

export async function hasAuthSession(): Promise<boolean> {
  const accessToken = await getAccessToken();
  const refreshToken = await getRefreshToken();
  return !!(accessToken || refreshToken);
}

/**
 * Apply token cookies to a NextResponse (used by api-proxy and refresh route)
 */
export function applyTokenCookiesToResponse(
  response: {
    cookies: { set: (name: string, value: string, options: object) => void };
  },
  tokens: AuthTokens
): void {
  const opts = {
    httpOnly: true,
    secure: true,
    sameSite: "lax" as const,
    path: "/",
  };
  response.cookies.set(COOKIE_NAME_ACCESS_TOKEN, tokens.accessToken, {
    ...opts,
    maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
  });
  response.cookies.set(COOKIE_NAME_REFRESH_TOKEN, tokens.refreshToken, {
    ...opts,
    maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
  });
}
