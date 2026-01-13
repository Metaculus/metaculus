"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";

import ServerAuthApi from "@/services/api/auth/auth.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { getRefreshToken } from "@/services/auth_tokens";
import {
  deleteImpersonatorSession,
  getImpersonatorRefreshToken,
  setImpersonatorRefreshToken,
  setServerSessionWithTokens,
} from "@/services/session";
import { ApiError } from "@/utils/core/errors";

export async function changePassword(password: string, new_password: string) {
  try {
    await ServerProfileApi.changePassword(password, new_password);

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

export async function stopImpersonatingAction() {
  const impersonatorRefreshToken = await getImpersonatorRefreshToken();

  if (impersonatorRefreshToken) {
    const tokens = await ServerAuthApi.refreshTokens(impersonatorRefreshToken);
    if (tokens) {
      await setServerSessionWithTokens(tokens);
    }
    await deleteImpersonatorSession();
  }

  redirect("/accounts/settings/bots/");
}

export async function impersonateBotAction(botId: number) {
  try {
    const userRefreshToken = await getRefreshToken();
    const botTokens = await ServerProfileApi.getBotJwt(botId);

    if (userRefreshToken) {
      await setImpersonatorRefreshToken(userRefreshToken);
    }

    await setServerSessionWithTokens(botTokens);

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
