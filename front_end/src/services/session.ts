import { cookies } from "next/headers";

export const COOKIE_NAME_TOKEN = "auth_token";
export const COOKIE_NAME_DEV_TOKEN = "alpha_token";
export const COOKIE_NAME_PRIVATE_SITE_TOKEN = "private_site_token";

export function setServerCookie(name: string, value: string) {
  cookies().set(name, value, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 182, // 6mo
    path: "/",
  });
}

export function setServerSession(auth_token: string) {
  return setServerCookie(COOKIE_NAME_TOKEN, auth_token);
}

export function getServerSession() {
  const cookie = cookies().get(COOKIE_NAME_TOKEN);

  return cookie?.value || null;
}

export function deleteServerSession() {
  cookies().delete(COOKIE_NAME_TOKEN);
}

export function getAlphaTokenSession() {
  const cookie = cookies().get(COOKIE_NAME_DEV_TOKEN);

  return cookie?.value || null;
}

export function setAlphaTokenSession(token: string) {
  return setServerCookie(COOKIE_NAME_DEV_TOKEN, token);
}

export function setPrivateSiteSession(token: string) {
  return setServerCookie(COOKIE_NAME_PRIVATE_SITE_TOKEN, token);
}

export function getPrivateSiteSession() {
  const cookie = cookies().get(COOKIE_NAME_PRIVATE_SITE_TOKEN);

  return cookie?.value || null;
}
