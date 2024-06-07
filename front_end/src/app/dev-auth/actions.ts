"use server";

import { devLoginSchema } from "@/app/dev-auth/schemas";
import { settDevTokenSession } from "@/services/session";
import { AuthResponse } from "@/types/auth";
import { getDevAccessToken } from "@/utils/dev_token";

export type DevLoginActionState = {
  errors?: any;
} | null;

export default async function devLoginAction(
  prevState: DevLoginActionState,
  formData: FormData
): Promise<DevLoginActionState> {
  const validatedFields = devLoginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let response: AuthResponse;

  const restrictedAccessToken = await getDevAccessToken();

  if (restrictedAccessToken !== validatedFields.data.token) {
    return {
      errors: {
        token: ["Invalid dev token"],
      },
    };
  }

  settDevTokenSession(validatedFields.data.token);

  return null;
}
