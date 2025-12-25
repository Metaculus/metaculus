import "server-only";
import { cookies } from "next/headers";

import {
  setAuthTokens,
  clearAuthTokens,
  getAccessToken,
  getRefreshToken,
  hasAuthSession,
  AuthTokens,
} from "@/services/auth_tokens";
import { AuthResponse } from "@/types/auth";

export const COOKIE_NAME_DEV_TOKEN = "alpha_token";
export const COOKIE_NAME_IMPERSONATOR_TOKEN = "impersonator_token";

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

export async function getImpersonatorSession() {
  const cookieStorage = await cookies();
  const cookie = cookieStorage.get(COOKIE_NAME_IMPERSONATOR_TOKEN);
  return cookie?.value || null;
}

// TODO: !!! THIS DOES NOT WORK; FIX IT !!!
export async function setImpersonatorSession(token: string) {
  return setServerCookie(COOKIE_NAME_IMPERSONATOR_TOKEN, token);
}

export async function deleteImpersonatorSession() {
  const cookieStorage = await cookies();
  cookieStorage.delete(COOKIE_NAME_IMPERSONATOR_TOKEN);
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
