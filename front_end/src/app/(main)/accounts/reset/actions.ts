"use server";

import {
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
} from "@/app/(main)/accounts/schemas";
import ServerAuthApi from "@/services/api/auth/auth.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { AuthResponse } from "@/types/auth";
import { ApiError } from "@/utils/core/errors";

import { ApiErrorPayload } from "../actions";

export type PasswordResetRequestActionState = {
  errors?: ApiErrorPayload | Record<string, string[]>;
} | null;

export async function passwordResetRequestAction(
  _prevState: PasswordResetRequestActionState,
  formData: FormData
): Promise<PasswordResetRequestActionState> {
  const validatedFields = passwordResetRequestSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    await ServerAuthApi.passwordResetRequest(validatedFields.data.login);

    return {};
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export type PasswordResetConfirmActionState = {
  errors?: ApiErrorPayload | Record<string, string[]>;
  data?: AuthResponse;
} | null;

export async function passwordResetConfirmAction(
  _prevState: PasswordResetConfirmActionState,
  formData: FormData
): Promise<PasswordResetConfirmActionState> {
  const validatedFields = passwordResetConfirmSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const response = await ServerAuthApi.passwordResetConfirm(
      validatedFields.data.user_id,
      validatedFields.data.token,
      validatedFields.data.password
    );

    const authManager = await getAuthCookieManager();
    authManager.setAuthTokens(response.tokens);

    return {
      data: response,
    };
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}
