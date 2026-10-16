"use server";

import { redirect } from "next/navigation";

import { ApiErrorPayload } from "@/app/(main)/accounts/actions";
import { emailRollbackSchema } from "@/app/(main)/accounts/schemas";
import ServerAuthApi from "@/services/api/auth/auth.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { ApiError } from "@/utils/core/errors";

export type EmailRollbackActionState = {
  errors?: ApiErrorPayload | Record<string, string[]>;
} | null;

export async function emailRollbackAction(
  _prevState: EmailRollbackActionState,
  formData: FormData
): Promise<EmailRollbackActionState> {
  const validatedFields = emailRollbackSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return { errors: validatedFields.error.flatten().fieldErrors };
  }

  try {
    const response = await ServerAuthApi.rollbackEmailChange(
      validatedFields.data.token,
      validatedFields.data.password
    );
    const authManager = await getAuthCookieManager();
    authManager.setAuthTokens(response.tokens);
  } catch (err) {
    if (!ApiError.isApiError(err)) {
      throw err;
    }

    return { errors: err.data };
  }

  redirect("/accounts/settings/account/?emailRestored=true");
}
