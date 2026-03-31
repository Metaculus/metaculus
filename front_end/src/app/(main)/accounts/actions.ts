"use server";

import { revalidatePath } from "next/cache";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { getLocale } from "next-intl/server";

import { SignUpSchema } from "@/app/(main)/accounts/schemas";
import ServerAuthApi from "@/services/api/auth/auth.server";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { LanguageService } from "@/services/language_service";
import { AuthResponse, SignUpResponse } from "@/types/auth";
import { CurrentUser } from "@/types/users";
import { ApiError } from "@/utils/core/errors";
import { getPublicSettings } from "@/utils/public_settings.server";

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
  errors?: ApiErrorPayload;
  user?: CurrentUser;
  postLoginAction?: PostLoginAction;
} | null;

export default async function loginAction(
  login: string,
  password: string
): Promise<LoginActionState> {
  let response: AuthResponse;

  try {
    response = await ServerAuthApi.signIn(login, password);
  } catch (err: unknown) {
    return {
      errors: ApiError.isApiError(err)
        ? (err.data as ApiErrorPayload)
        : { detail: "Something went wrong. Please try again." },
    };
  }

  const authManager = await getAuthCookieManager();
  authManager.setAuthTokens(response.tokens);

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

    if (response.is_active && response.tokens) {
      const authManager = await getAuthCookieManager();
      authManager.setAuthTokens(response.tokens);

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
  try {
    await ServerAuthApi.logout();
  } catch {}

  const authManager = await getAuthCookieManager();
  authManager.clearAuthTokens();
  authManager.clearImpersonatorRefreshToken();

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

    if (response && response.tokens) {
      const authManager = await getAuthCookieManager();
      authManager.setAuthTokens(response.tokens);
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
