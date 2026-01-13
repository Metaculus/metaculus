import "server-only";

import { cookies } from "next/headers";

import { AuthTokens } from "@/types/auth";

// Re-export for convenience
export type { AuthTokens } from "@/types/auth";

// Constants
export const COOKIE_NAME_ACCESS_TOKEN = "metaculus_access_token";
export const COOKIE_NAME_REFRESH_TOKEN = "metaculus_refresh_token";

// Token expiration times (should match backend)
export const ACCESS_TOKEN_EXPIRY_SECONDS = 15 * 60; // 15 minutes
export const REFRESH_TOKEN_EXPIRY_SECONDS = 30 * 24 * 60 * 60; // 30 days
export const REFRESH_BUFFER_SECONDS = 30; // Refresh if expiring within 30s

const AUTH_COOKIE_OPTIONS = {
  httpOnly: true,
  secure: true,
  sameSite: "lax" as const,
  path: "/",
};

/**
 * Decode JWT payload without verification (we just need expiration time)
 */
export function decodeJWTPayload(token: string): { exp?: number } | null {
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
 * Check if a token is expired or about to expire
 */
export function isTokenExpired(
  token: string | undefined,
  bufferSeconds: number = REFRESH_BUFFER_SECONDS
): boolean {
  if (!token) return true;

  const payload = decodeJWTPayload(token);
  if (!payload?.exp) return false; // Can't determine, assume not expired

  const expiresAt = payload.exp * 1000;
  const now = Date.now();
  const bufferMs = bufferSeconds * 1000;

  return now >= expiresAt - bufferMs;
}

type CookieOptions = {
  httpOnly?: boolean;
  secure?: boolean;
  sameSite?: "lax" | "strict" | "none";
  path?: string;
  maxAge?: number;
};

export interface ReadonlyCookieStorage {
  get(name: string): { value: string } | undefined;
}

export interface CookieStorage extends ReadonlyCookieStorage {
  set(name: string, value: string, options?: CookieOptions): void;
  delete(name: string): void;
}

/**
 * Read-only manager for auth token cookies.
 * Works with request.cookies (ReadonlyCookieStorage).
 */
export class AuthCookieReader {
  constructor(private cookieStorage: ReadonlyCookieStorage) {}

  getAccessToken(): string | null {
    return this.cookieStorage.get(COOKIE_NAME_ACCESS_TOKEN)?.value || null;
  }

  getRefreshToken(): string | null {
    return this.cookieStorage.get(COOKIE_NAME_REFRESH_TOKEN)?.value || null;
  }

  hasAuthSession(): boolean {
    return !!(this.getAccessToken() || this.getRefreshToken());
  }

  isAccessTokenExpired(
    bufferSeconds: number = REFRESH_BUFFER_SECONDS
  ): boolean {
    const token = this.getAccessToken();
    return isTokenExpired(token ?? undefined, bufferSeconds);
  }
}

/**
 * Full manager for auth token cookies with read/write access.
 * Works with next/headers cookies() and response.cookies (CookieStorage).
 */
export class AuthCookieManager extends AuthCookieReader {
  constructor(private writableCookieStorage: CookieStorage) {
    super(writableCookieStorage);
  }

  setAuthTokens(tokens: AuthTokens): void {
    this.writableCookieStorage.set(COOKIE_NAME_ACCESS_TOKEN, tokens.access, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: ACCESS_TOKEN_EXPIRY_SECONDS,
    });

    this.writableCookieStorage.set(COOKIE_NAME_REFRESH_TOKEN, tokens.refresh, {
      ...AUTH_COOKIE_OPTIONS,
      maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
    });
  }

  clearAuthTokens(): void {
    this.writableCookieStorage.delete(COOKIE_NAME_ACCESS_TOKEN);
    this.writableCookieStorage.delete(COOKIE_NAME_REFRESH_TOKEN);
  }
}

/**
 * Factory function to create an AuthCookieManager from next/headers cookies().
 * Use this in server components and server actions.
 */
export async function getAuthCookieManager(): Promise<AuthCookieManager> {
  const cookieStorage = await cookies();
  return new AuthCookieManager(cookieStorage);
}
