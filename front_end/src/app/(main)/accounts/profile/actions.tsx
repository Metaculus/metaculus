"use server";

import { revalidatePath } from "next/cache";

import {
  changeUsernameSchema,
  updateProfileSchema,
} from "@/app/(main)/accounts/schemas";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { getAuthCookieManager } from "@/services/auth_tokens";
import { LanguageService } from "@/services/language_service";
import type { ErrorResponse } from "@/types/fetch";
import { CurrentUser } from "@/types/users";
import { ApiError } from "@/utils/core/errors";

export type ChangeUsernameState = {
  errors?: ErrorResponse;
  user?: CurrentUser;
} | null;

export default async function changeUsernameAction(
  _prevState: ChangeUsernameState,
  formData: FormData
): Promise<ChangeUsernameState> {
  const validatedFields = changeUsernameSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await ServerProfileApi.changeUsername(
      validatedFields.data.username
    );
    revalidatePath("/");

    return {
      user,
    };
  } catch (err) {
    return {
      errors: ApiError.isApiError(err)
        ? (err.data as ErrorResponse)
        : undefined,
    };
  }
}

export async function softDeleteUserAction(userId: number) {
  try {
    return await ServerProfileApi.markUserAsSpam(userId);
  } catch (err) {
    return {
      errors: ApiError.isApiError(err)
        ? (err.data as ErrorResponse)
        : undefined,
    };
  }
}

export type UpdateProfileState = {
  errors?: ErrorResponse;
  user?: CurrentUser;
} | null;

export async function updateProfileFormAction(
  _prevState: UpdateProfileState,
  formData: FormData
): Promise<UpdateProfileState> {
  const validatedFields = updateProfileSchema.safeParse(
    Object.fromEntries(formData.entries())
  );

  if (!validatedFields.success) {
    return {
      errors: validatedFields.error.flatten().fieldErrors,
    };
  }

  try {
    const user = await ServerProfileApi.updateProfile(validatedFields.data);
    revalidatePath("/");

    return {
      user,
    };
  } catch (err) {
    return {
      errors: ApiError.isApiError(err)
        ? (err.data as ErrorResponse)
        : undefined,
    };
  }
}

export async function updateProfileAction(
  profile: Partial<
    Pick<
      CurrentUser,
      | "unsubscribed_mailing_tags"
      | "unsubscribed_preferences_tags"
      | "hide_community_prediction"
      | "is_onboarding_complete"
      | "prediction_expiration_percent"
      | "app_theme"
      | "interface_type"
      | "language"
    >
  >,
  revalidate = true
) {
  const response = await ServerProfileApi.updateProfile(profile);

  if (revalidate) {
    revalidatePath("/");
  }

  return response;
}

/**
 * Server action to update user's language preference and set the language cookie
 */
export async function updateLanguagePreference(
  language: string,
  revalidate = true
) {
  const authManager = await getAuthCookieManager();

  if (authManager.hasAuthSession()) {
    // Update the user's language preference in the database
    await ServerProfileApi.updateProfile({
      language: language,
    });
  }

  // Set the language as the active locale
  await LanguageService.setLocaleCookie(language);
  revalidate && revalidatePath("/");
}
