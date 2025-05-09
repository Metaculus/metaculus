import "server-only";
import { cookies } from "next/headers";

export const COOKIE_NAME_TOKEN = "auth_token";
export const COOKIE_NAME_DEV_TOKEN = "alpha_token";

export async function setServerCookie(name: string, value: string) {
  const cookieStorage = await cookies();
  cookieStorage.set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 182, // 6mo
    path: "/",
  });
}

export async function setServerSession(auth_token: string) {
  return setServerCookie(COOKIE_NAME_TOKEN, auth_token);
}

export async function getServerSession() {
  const cookieStorage = await cookies();
  const cookie = cookieStorage.get(COOKIE_NAME_TOKEN);

  return cookie?.value || null;
}

export async function deleteServerSession() {
  const cookieStorage = await cookies();
  cookieStorage.delete(COOKIE_NAME_TOKEN);
}

export async function getAlphaTokenSession() {
  const cookieStorage = await cookies();
  const cookie = cookieStorage.get(COOKIE_NAME_DEV_TOKEN);

  return cookie?.value || null;
}

export function setAlphaTokenSession(token: string) {
  return setServerCookie(COOKIE_NAME_DEV_TOKEN, token);
}
