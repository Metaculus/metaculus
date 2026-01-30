"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import ServerAuthApi from "@/services/api/auth/auth.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { ApiError } from "@/utils/core/errors";

export async function changePassword(password: string, new_password: string) {
  try {
    const tokens = await ServerProfileApi.changePassword(
      password,
      new_password
    );
    const authManager = await getAuthCookieManager();
    authManager.setAuthTokens(tokens);

    return {};
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return {
      errors: err.data,
    };
  }
}

export async function changeEmail(email: string, password: string) {
  try {
    await ServerProfileApi.changeEmail(email, password);

    return {};
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return {
      errors: err.data,
    };
  }
}

export async function emailMeMyData() {
  try {
    return await ServerProfileApi.emailMeMyData();
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return {
      errors: err.data,
    };
  }
}

export async function createBot(username: string) {
  try {
    const data = await ServerProfileApi.createBot({ username });

    return {
      token: data.token,
    };
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return {
      errors: err.data,
    };
  }
}

export async function updateBot(
  botId: number,
  data: { username?: string; bio?: string; website?: string }
) {
  try {
    const response = await ServerProfileApi.updateBot(botId, data);
    revalidatePath(`/accounts/profile/${botId}/`);
    return {
      data: response,
    };
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return {
      errors: err.data,
    };
  }
}

export async function getBotTokenAction(botId: number) {
  try {
    const data = await ServerProfileApi.getBotToken(botId);

    return {
      token: data.token,
    };
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return {
      errors: err.data,
    };
  }
}

export async function getApiKeyAction() {
  try {
    const data = await ServerAuthApi.getApiKey();

    return {
      key: data.key,
    };
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return {
      errors: err.data,
    };
  }
}

export async function rotateApiKeyAction() {
  try {
    const data = await ServerAuthApi.rotateApiKey();

    return {
      key: data.key,
    };
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return {
      errors: err.data,
    };
  }
}

export async function stopImpersonatingAction() {
  const authManager = await getAuthCookieManager();
  const impersonatorRefreshToken = authManager.getImpersonatorRefreshToken();

  if (impersonatorRefreshToken) {
    const tokens = await ServerAuthApi.refreshTokens(impersonatorRefreshToken);
    if (tokens) {
      authManager.setAuthTokens(tokens);
    }
    authManager.clearImpersonatorRefreshToken();
  }

  redirect("/accounts/settings/bots/");
}

export async function impersonateBotAction(botId: number) {
  try {
    const authManager = await getAuthCookieManager();
    const userRefreshToken = authManager.getRefreshToken();
    const botTokens = await ServerProfileApi.getBotJwt(botId);

    if (userRefreshToken) {
      authManager.setImpersonatorRefreshToken(userRefreshToken);
    }

    authManager.setAuthTokens(botTokens);

    redirect("/");
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return {
      errors: err.data,
    };
  }
}
