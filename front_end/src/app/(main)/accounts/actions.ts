"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { signInSchema, signUpSchema } from "@/app/(main)/accounts/schemas";
import AuthApi from "@/services/auth";
import { deleteServerSession, setServerSession } from "@/services/session";
import { AuthResponse, SignUpResponse } from "@/types/auth";
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

export type SignUpActionState =
  | ({
      errors?: any;
    } & Partial<SignUpResponse>)
  | null;

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

  let addToProject;
  if (validatedFields.data.addToProject) {
    addToProject = parseInt(validatedFields.data.addToProject);
  }

  try {
    const response = await AuthApi.signUp(
      validatedFields.data.email,
      validatedFields.data.username,
      validatedFields.data.password,
      validatedFields.data.isBot,
      {
        "cf-turnstile-response": validatedFields.data.turnstileToken,
        "CF-Connecting-IP": headersList.get("CF-Connecting-IP"),
      },
      addToProject
    );

    if (response.is_active && response.token) {
      setServerSession(response.token);
      revalidatePath("/");
    }

    return response;
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function LogOut() {
  deleteServerSession();
  return redirect("/");
}
