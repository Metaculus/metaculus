"use server";

import { changeUsernameSchema } from "@/app/accounts/schemas";
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
