"use server";

import ServerProfileApi from "@/services/api/profile/profile.server";
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
