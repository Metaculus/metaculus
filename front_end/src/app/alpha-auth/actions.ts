"use server";

import { redirect } from "next/navigation";

import { devLoginSchema } from "@/app/alpha-auth/schemas";
import { setAlphaTokenSession } from "@/services/session";
import { getAlphaAccessToken } from "@/utils/alpha_access";

export type AlphaLoginActionState = {
  errors?: any;
} | null;

export default async function alphaLoginAction(
  prevState: AlphaLoginActionState,
  formData: FormData
): Promise<AlphaLoginActionState> {
  const validatedFields = devLoginSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  const alphaAccessToken = await getAlphaAccessToken();

  if (alphaAccessToken !== validatedFields.data.token) {
    return {
      errors: {
        token: ["Invalid dev token"],
      },
    };
  }

  setAlphaTokenSession(validatedFields.data.token);

  return redirect("/");
}
