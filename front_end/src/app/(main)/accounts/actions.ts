"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";

import { signInSchema, SignUpSchema } from "@/app/(main)/accounts/schemas";
import ServerAuthApi from "@/services/api/auth/auth.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { deleteServerSession, setServerSession } from "@/services/session";
import { AuthResponse, SignUpResponse } from "@/types/auth";
import { CurrentUser } from "@/types/users";
import { ApiError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

export type PostLoginAction = {
  type: "redirect";
  payload: string;
};

export type LoginActionState = {
  errors?: any;
  user?: CurrentUser;
  postLoginAction?: PostLoginAction;
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
    response = await ServerAuthApi.signIn(
      validatedFields.data.login,
      validatedFields.data.password
    );
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }

  await setServerSession(response.token);

  const { PUBLIC_LANDING_PAGE_URL, PUBLIC_AUTHENTICATION_REQUIRED } =
    getPublicSettings();

  return {
    user: response.user,
    postLoginAction: PUBLIC_AUTHENTICATION_REQUIRED
      ? { type: "redirect", payload: PUBLIC_LANDING_PAGE_URL }
      : undefined,
  };
}

export type SignUpActionState =
  | ({
      errors?: any;
    } & Partial<SignUpResponse> & { postLoginAction?: PostLoginAction })
  | null;

export async function signUpAction(
  validatedSignupData: SignUpSchema & { redirectUrl?: string }
): Promise<SignUpActionState> {
  const headersList = await headers();

  const ipAddress =
    headersList.get("CF-Connecting-IP") || headersList.get("X-Real-IP");

  try {
    const response = await ServerAuthApi.signUp(
      {
        email: validatedSignupData.email,
        username: validatedSignupData.username,
        password: validatedSignupData.password,
        is_bot: validatedSignupData.isBot,
        add_to_project: validatedSignupData.addToProject,
        campaign_key: validatedSignupData.campaignKey,
        campaign_data: validatedSignupData.campaignData,
        redirect_url: validatedSignupData.redirectUrl,
        invite_token: validatedSignupData.inviteToken,
      },
      {
        ...(validatedSignupData.turnstileToken
          ? { "cf-turnstile-response": validatedSignupData.turnstileToken }
          : {}),
        ...(ipAddress ? { "CF-Connecting-IP": ipAddress } : {}),
      }
    );

    const signUpActionState: SignUpActionState = { ...response };

    if (response.is_active && response.token) {
      await setServerSession(response.token);

      revalidatePath("/");

      const { PUBLIC_LANDING_PAGE_URL, PUBLIC_AUTHENTICATION_REQUIRED } =
        getPublicSettings();

      if (PUBLIC_AUTHENTICATION_REQUIRED) {
        signUpActionState.postLoginAction = {
          type: "redirect",
          payload: PUBLIC_LANDING_PAGE_URL,
        };
      }
    }

    return signUpActionState;
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function LogOut() {
  await deleteServerSession();
  return redirect("/");
}

export async function registerUserCampaignAction(
  key: string,
  details: object,
  addToProject?: number
): Promise<{ errors?: any }> {
  try {
    await ServerProfileApi.registerUserCampaign(key, details, addToProject);
    return { errors: null };
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function resendActivationEmailAction(
  login: string,
  redirectUrl: string
): Promise<{ errors?: any }> {
  try {
    await ServerAuthApi.resendActivationEmail(login, redirectUrl);
    return { errors: null };
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function inviteUsers(emails: string[]) {
  await ServerAuthApi.inviteUsers(emails);
}
