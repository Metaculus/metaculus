"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { signInSchema, SignUpSchema } from "@/app/(main)/accounts/schemas";
import AuthApi from "@/services/auth";
import ProfileApi from "@/services/profile";
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
  validatedSignupData: SignUpSchema & { redirectUrl?: string }
): Promise<SignUpActionState> {
  const headersList = headers();

  const ipAddress =
    headersList.get("CF-Connecting-IP") || headersList.get("X-Real-IP");

  try {
    const response = await AuthApi.signUp(
      validatedSignupData.email,
      validatedSignupData.username,
      validatedSignupData.password,
      validatedSignupData.isBot,
      {
        "cf-turnstile-response": validatedSignupData.turnstileToken,
        ...(ipAddress ? { "CF-Connecting-IP": ipAddress } : {}),
      },
      validatedSignupData.addToProject,
      validatedSignupData.campaignKey,
      validatedSignupData.campaignData,
      validatedSignupData.redirectUrl
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

export async function registerUserCampaignAction(
  key: string,
  details: object,
  addToProject?: number
): Promise<{ errors?: any }> {
  try {
    await ProfileApi.registerUserCampaign(key, details, addToProject);
    return { errors: null };
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export async function resendActivationEmailAction(
  login: string,
  redirectUrl: string
): Promise<{ errors?: any }> {
  try {
    await AuthApi.resendActivationEmail(login, redirectUrl);
    return { errors: null };
  } catch (err) {
    const error = err as FetchError;
    return {
      errors: error.data,
    };
  }
}
