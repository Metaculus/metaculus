"use server";

import { revalidatePath } from "next/cache";

import {
  changeUsernameSchema,
  updateProfileSchema,
} from "@/app/(main)/accounts/schemas";
import ProfileApi from "@/services/profile";
import { FetchError } from "@/types/fetch";
import { CurrentUser } from "@/types/users";

export type ChangeUsernameState = {
  errors?: any;
  user?: CurrentUser;
} | null;

export default async function changeUsernameAction(
  prevState: ChangeUsernameState,
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
    const user = await ProfileApi.changeUsername(validatedFields.data.username);
    revalidatePath("/");

    return {
      user,
    };
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
    };
  }
}

export type UpdateProfileState = {
  errors?: any;
  user?: CurrentUser;
} | null;

export async function updateProfileFormAction(
  prevState: UpdateProfileState,
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
    const user = await ProfileApi.updateProfile(validatedFields.data);
    revalidatePath("/");

    return {
      user,
    };
  } catch (err) {
    const error = err as FetchError;

    return {
      errors: error.data,
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
    >
  >
) {
  const response = await ProfileApi.updateProfile(profile);

  revalidatePath("/");

  return response;
}
