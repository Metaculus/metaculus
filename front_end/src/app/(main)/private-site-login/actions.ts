"use server";

import { setPrivateSiteSession } from "@/services/session";
import { post } from "@/utils/fetch";

type PrivateSiteLoginResponse = {
  token?: string;
  errors?: string[];
};

export async function sumbitPrivateSiteLogin(
  password: string
): Promise<PrivateSiteLoginResponse> {
  return await post("/auth/private-site-password-submit/", {
    password,
  });
}

export async function setPrivateSiteToken(token: string) {
  setPrivateSiteSession(token);
}
