"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";
import { z } from "zod";

import { signInSchema, SignUpSchema } from "@/app/(main)/accounts/schemas";
import ServerAuthApi from "@/services/api/auth/auth.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { LanguageService } from "@/services/language_service";
import {
  deleteImpersonatorSession,
  deleteServerSession,
  setServerSession,
} from "@/services/session";
import { AuthResponse, SignUpResponse } from "@/types/auth";
import { CurrentUser } from "@/types/users";
import { ApiError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

type FieldErrorsFrom<TSchema extends z.ZodTypeAny> =
  z.inferFlattenedErrors<TSchema>["fieldErrors"];

export type ApiErrorPayload = {
  message?: string;
  detail?: string;
  non_field_errors?: string[];
  fieldErrors?: Record<string, string[]>;
  [key: string]: unknown;
};

export type PostLoginAction = {
  type: "redirect";
  payload: string;
};

export type LoginActionState = {
  errors?: FieldErrorsFrom<typeof signInSchema> | ApiErrorPayload;
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
  } catch (err: unknown) {
    return {
      errors: ApiError.isApiError(err)
        ? (err.data as ApiErrorPayload)
        : undefined,
    };
  }

  await setServerSession(response);

  // Set user's language preference as the active locale
  if (response.user.language) {
    await LanguageService.setLocaleCookie(response.user.language);
  }

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
  | (Partial<SignUpResponse> & {
      errors?: ApiErrorPayload;
      postLoginAction?: PostLoginAction;
    })
  | null;

export async function signUpAction(
  validatedSignupData: SignUpSchema & {
    redirectUrl?: string;
    appTheme?: string;
  }
): Promise<SignUpActionState> {
  const headersList = await headers();

  // Get current language from cookie or autodetected locale
  const currentLanguage = await getLocale();

  const ipAddress =
    headersList.get("CF-Connecting-IP") || headersList.get("X-Real-IP");

  try {
    const response = await ServerAuthApi.signUp(
      {
        email: validatedSignupData.email,
        username: validatedSignupData.username,
        password: validatedSignupData.password,
        add_to_project: validatedSignupData.addToProject,
        campaign_key: validatedSignupData.campaignKey,
        campaign_data: validatedSignupData.campaignData,
        redirect_url: validatedSignupData.redirectUrl,
        invite_token: validatedSignupData.inviteToken,
        newsletter_optin: validatedSignupData.newsletterOptin,
        language: currentLanguage,
        app_theme: validatedSignupData.appTheme,
      },
      {
        ...(validatedSignupData.turnstileToken
          ? { "cf-turnstile-response": validatedSignupData.turnstileToken }
          : {}),
        ...(ipAddress ? { "CF-Connecting-IP": ipAddress } : {}),
      }
    );

    const signUpActionState: SignUpActionState = { ...response };

    if (response.is_active && response.access_token && response.refresh_token) {
      await setServerSession(response);

      // Set user's language preference as the active locale
      if (response.user?.language) {
        await LanguageService.setLocaleCookie(response.user.language);
      }

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
  } catch (err: unknown) {
    return {
      errors: ApiError.isApiError(err)
        ? (err.data as ApiErrorPayload)
        : undefined,
    };
  }
}

export async function LogOut() {
  await deleteServerSession();
  await deleteImpersonatorSession();
  return redirect("/");
}

export async function registerUserCampaignAction(
  key: string,
  details: Record<string, unknown>,
  addToProject?: number
): Promise<{ errors?: ApiErrorPayload | null }> {
  try {
    await ServerProfileApi.registerUserCampaign(key, details, addToProject);
    return { errors: null };
  } catch (err: unknown) {
    return {
      errors: ApiError.isApiError(err)
        ? (err.data as ApiErrorPayload)
        : undefined,
    };
  }
}

export async function resendActivationEmailAction(
  login: string,
  redirectUrl: string
): Promise<{ errors?: ApiErrorPayload | null }> {
  try {
    await ServerAuthApi.resendActivationEmail(login, redirectUrl);
    return { errors: null };
  } catch (err: unknown) {
    return {
      errors: ApiError.isApiError(err)
        ? (err.data as ApiErrorPayload)
        : undefined,
    };
  }
}

export async function inviteUsers(emails: string[]) {
  await ServerAuthApi.inviteUsers(emails);
}

export async function simplifiedSignUpAction(
  username: string,
  authToken: string
) {
  try {
    const response = await ServerAuthApi.simplifiedSignUp(username, authToken);

    if (response) {
      await setServerSession(response);
    }
    return response;
  } catch (err: unknown) {
    return {
      errors: ApiError.isApiError(err)
        ? (err.data as ApiErrorPayload)
        : undefined,
    };
  }
}
