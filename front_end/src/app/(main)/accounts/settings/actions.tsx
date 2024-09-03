"use server";

import ProfileApi from "@/services/profile";
import { FetchError } from "@/types/fetch";

export async function changePassword(password: string, new_password: string) {
  try {
    await ProfileApi.changePassword(password, new_password);

    return {};
  } catch (err) {
    const error = err as FetchError;

    if (!error.data) {
      throw err;
    }

    return {
      errors: error.data,
    };
  }
}

export async function changeEmail(email: string, password: string) {
  try {
    await ProfileApi.changeEmail(email, password);

    return {};
  } catch (err) {
    const error = err as FetchError;

    if (!error.data) {
      throw err;
    }

    return {
      errors: error.data,
    };
  }
}
