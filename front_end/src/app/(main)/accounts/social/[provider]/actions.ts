"use server";

import AuthApi from "@/services/auth";
import { setServerSession } from "@/services/session";
import { SocialProviderType } from "@/types/auth";
import { getPublicSettings } from "@/utils/public-settings";

export async function exchangeSocialOauthCode(
  provider: SocialProviderType,
  code: string
) {
  const { PUBLIC_APP_URL } = getPublicSettings();
  const response = await AuthApi.exchangeSocialOauthCode(
    provider,
    code,
    `${PUBLIC_APP_URL}/accounts/social/${provider}`
  );

  if (response?.token) {
    setServerSession(response.token);
  }
}
