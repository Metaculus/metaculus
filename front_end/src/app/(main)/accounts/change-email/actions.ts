"use server";

import { redirect } from "next/navigation";

import ServerProfileApi from "@/services/api/profile/profile.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { ApiError } from "@/utils/core/errors";

export async function confirmEmailChange(token: string) {
  try {
    const tokens = await ServerProfileApi.changeEmailConfirm(token);
    const authManager = await getAuthCookieManager();
    authManager.setAuthTokens(tokens);
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return { errors: err.data };
  }

  redirect("/accounts/settings/account/?emailChanged=true");
}
