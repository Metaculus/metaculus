import { cookies } from "next/headers";

export function setServerSession(auth_token: string) {
  cookies().set("auth_token", auth_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // One week
    path: "/",
  });
}

export function getServerSession() {
  let cookie = cookies().get("auth_token");

  return cookie?.value || null;
}

export function deleteServerSession() {
  cookies().delete("auth_token");
}
