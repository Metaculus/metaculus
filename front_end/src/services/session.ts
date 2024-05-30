"use server";

import { redirect } from "next/navigation";
import { cookies } from "next/headers";

export default async function setServerSession(auth_token: string) {
  cookies().set("auth_token", auth_token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7, // One week
    path: "/",
  });
}

export async function getServerSession() {
  return cookies().get("auth_token");
}

export async function getLoggedInUserOrRedirect(
  redirectUrl = "/"
): Promise<{}> {
  // TODO: probably we need to fetch user's profile every time page is loaded
  const token = await getServerSession();

  if (!token) {
    throw redirect(redirectUrl);
  }

  return {};
}
