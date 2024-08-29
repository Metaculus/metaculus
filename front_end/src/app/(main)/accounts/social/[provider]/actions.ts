"use server";

import AuthApi from "@/services/auth";
import { setServerSession } from "@/services/session";
import { SocialProviderType } from "@/types/auth";

export async function exchangeSocialOauthCode(
  provider: SocialProviderType,
  code: string
) {
  const response = await AuthApi.exchangeSocialOauthCode(
    provider,
    code,
    `${process.env.APP_URL}/accounts/social/${provider}`
  );

  if (response?.token) {
    setServerSession(response.token);
  }
}
