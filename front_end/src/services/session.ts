import { cookies } from "next/headers";

export const COOKIE_NAME_TOKEN = "auth_token";

export function setServerSession(auth_token: string) {
  cookies().set(COOKIE_NAME_TOKEN, auth_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // One week
    path: "/",
  });
}

export function getServerSession() {
  const cookie = cookies().get(COOKIE_NAME_TOKEN);

  return cookie?.value || null;
}

export function deleteServerSession() {
  cookies().delete(COOKIE_NAME_TOKEN);
}
