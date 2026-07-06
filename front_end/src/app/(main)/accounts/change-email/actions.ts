"use server";

import ServerProfileApi from "@/services/api/profile/profile.server";
import { getAuthCookieManager } from "@/services/auth_tokens";

export async function confirmEmailChange(token: string) {
  const tokens = await ServerProfileApi.changeEmailConfirm(token);
  const authManager = await getAuthCookieManager();
  authManager.setAuthTokens(tokens);
}
