"use server";

import ProfileApi from "@/services/profile";
import { ApiError } from "@/utils/errors";

export async function changePassword(password: string, new_password: string) {
  try {
    await ProfileApi.changePassword(password, new_password);

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
    await ProfileApi.changeEmail(email, password);

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
