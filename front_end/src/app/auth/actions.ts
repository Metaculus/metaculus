"use server";

import { signInSchema } from "@/app/auth/schemas";
import AuthApi from "@/services/auth";
import { setServerSession } from "@/services/session";
import { AuthResponse } from "@/types/auth";
import { FetchError } from "@/types/fetch";
import { CurrentUser } from "@/types/users";

export type State = {
  errors?: any;
  user?: CurrentUser;
} | null;

export default async function loginAction(
  prevState: State,
  formData: FormData
): Promise<State> {
  console.log("MESSAGE!!!", formData);
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

  console.log(response);

  return {
    user: response.user,
  };
}
