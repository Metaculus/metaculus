import "server-only";
import { cookies } from "next/headers";

import {
  setAuthTokens,
  clearAuthTokens,
  getAccessToken,
  AuthTokens,
  REFRESH_TOKEN_EXPIRY_SECONDS,
} from "@/services/auth_tokens";
import { AuthResponse } from "@/types/auth";

export const COOKIE_NAME_DEV_TOKEN = "alpha_token";
export const COOKIE_NAME_IMPERSONATOR_REFRESH_TOKEN =
  "impersonator_refresh_token";

async function setServerCookie(name: string, value: string) {
  const cookieStorage = await cookies();
  cookieStorage.set(name, value, {
    httpOnly: true,
    secure: true,
    maxAge: 60 * 60 * 24 * 182, // 6mo
    path: "/",
  });
}

export async function setServerSession(response: AuthResponse): Promise<void> {
  await setAuthTokens(response.tokens);
}

export async function setServerSessionWithTokens(
  tokens: AuthTokens
): Promise<void> {
  await setAuthTokens(tokens);
}

export async function getServerSession(): Promise<string | null> {
  return getAccessToken();
}

export async function getImpersonatorRefreshToken(): Promise<string | null> {
  const cookieStorage = await cookies();
  const cookie = cookieStorage.get(COOKIE_NAME_IMPERSONATOR_REFRESH_TOKEN);
  return cookie?.value || null;
}

export async function setImpersonatorRefreshToken(
  refreshToken: string
): Promise<void> {
  const cookieStorage = await cookies();
  cookieStorage.set(COOKIE_NAME_IMPERSONATOR_REFRESH_TOKEN, refreshToken, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: REFRESH_TOKEN_EXPIRY_SECONDS,
    path: "/",
  });
}

export async function deleteImpersonatorSession(): Promise<void> {
  const cookieStorage = await cookies();
  cookieStorage.delete(COOKIE_NAME_IMPERSONATOR_REFRESH_TOKEN);
}

export async function deleteServerSession() {
  await clearAuthTokens();
}

export async function getAlphaTokenSession() {
  const cookieStorage = await cookies();
  const cookie = cookieStorage.get(COOKIE_NAME_DEV_TOKEN);
  return cookie?.value || null;
}

export function setAlphaTokenSession(token: string) {
  return setServerCookie(COOKIE_NAME_DEV_TOKEN, token);
}
