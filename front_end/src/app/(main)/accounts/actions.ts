"use server";

import { headers } from "next/headers";

import { signInSchema, signUpSchema } from "@/app/(main)/accounts/schemas";
import AuthApi from "@/services/auth";
import { setServerSession } from "@/services/session";
import { AuthResponse } from "@/types/auth";
import { FetchError } from "@/types/fetch";
import { CurrentUser } from "@/types/users";

export type LoginActionState = {
  errors?: any;
  user?: CurrentUser;
} | null;

export default async function loginAction(
  prevState: LoginActionState,
  formData: FormData
): Promise<LoginActionState> {
  const validatedFields = signInSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  let response: AuthResponse;

  try {
    response = await AuthApi.signIn(
      validatedFields.data.login,
      validatedFields.data.password
    );
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }

  setServerSession(response.token);

  return {
    user: response.user,
  };
}

export type SignUpActionState = {
  errors?: any;
} | null;

export async function signUpAction(
  prevState: SignUpActionState,
  formData: FormData
): Promise<SignUpActionState> {
  const headersList = headers();

  const validatedFields = signUpSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const response = await AuthApi.signUp(
      validatedFields.data.email,
      validatedFields.data.username,
      validatedFields.data.password,
      {
        "cf-turnstile-response": validatedFields.data.turnstileToken,
        "CF-Connecting-IP": headersList.get("CF-Connecting-IP"),
      }
    );

    return {};
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}
