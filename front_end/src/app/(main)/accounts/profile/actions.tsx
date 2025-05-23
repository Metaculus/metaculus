"use server";

import { revalidatePath } from "next/cache";

import {
  changeUsernameSchema,
  updateProfileSchema,
} from "@/app/(main)/accounts/schemas";
import ServerProfileApi from "@/services/api/profile/profile.server";
import { CurrentUser } from "@/types/users";
import { ApiError } from "@/utils/core/errors";

export type ChangeUsernameState = {
  errors?: any;
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
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export async function softDeleteUserAction(userId: number) {
  try {
    return await ServerProfileApi.markUserAsSpam(userId);
  } catch (err) {
    return {
      errors: ApiError.isApiError(err) ? err.data : undefined,
    };
  }
}

export type UpdateProfileState = {
  errors?: any;
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
      errors: ApiError.isApiError(err) ? err.data : undefined,
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
