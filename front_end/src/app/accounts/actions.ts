"use server";

import { redirect } from "next/navigation";

import {
  passwordResetConfirmSchema,
  passwordResetRequestSchema,
  signInSchema,
  signUpSchema,
} from "@/app/accounts/schemas";
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
      validatedFields.data.password
    );

    return {};
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export type PasswordResetRequestActionState = {
  errors?: any;
} | null;

export async function passwordResetRequestAction(
  prevState: PasswordResetRequestActionState,
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
    const response = await AuthApi.passwordResetRequest(
      validatedFields.data.login
    );

    return {};
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export type PasswordResetConfirmActionState = {
  errors?: any;
  data?: AuthResponse;
} | null;

export async function passwordResetConfirmAction(
  prevState: PasswordResetConfirmActionState,
  formData: FormData
): Promise<PasswordResetConfirmActionState> {
  const validatedFields = passwordResetConfirmSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  console.log(Object.fromEntries(formData.entries()));

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const response = await AuthApi.passwordResetConfirm(
      validatedFields.data.user_id,
      validatedFields.data.token,
      validatedFields.data.password
    );

    setServerSession(response.token);

    return {
      data: response,
    };
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}
