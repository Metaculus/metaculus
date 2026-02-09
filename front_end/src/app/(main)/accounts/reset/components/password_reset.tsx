"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useActionState } from "react";
import { useForm } from "react-hook-form";

import {
  passwordResetConfirmAction,
  PasswordResetConfirmActionState,
} from "@/app/(main)/accounts/reset/actions";
import {
  PasswordResetConfirmSchema,
  passwordResetConfirmSchema,
} from "@/app/(main)/accounts/schemas";
import Button from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";

export type PasswordResetProps = {
  user_id: number;
  token: string;
};

const PasswordReset: FC<PasswordResetProps> = ({ user_id, token }) => {
  const t = useTranslations();
  const { register } = useForm<PasswordResetConfirmSchema>({
    resolver: zodResolver(passwordResetConfirmSchema),
  });
  const [state, formAction, isPending] = useActionState<
    PasswordResetConfirmActionState,
    FormData
  >(passwordResetConfirmAction, null);

  return (
    <div className="mt-6 grid md:grid-cols-2">
      <form className="flex flex-col gap-4" action={formAction}>
        <input type="hidden" defaultValue={user_id} {...register("user_id")} />
        <input type="hidden" defaultValue={token} {...register("token")} />
        <div>
          <Input
            className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
            placeholder={t("newPasswordPlaceholder")}
            type="password"
            {...register("password")}
          />
          <FormError errors={state?.errors} name="password" />
        </div>
        <div>
          <Input
            className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
            placeholder={t("verifyPasswordPlaceholder")}
            type="password"
            {...register("passwordAgain")}
          />
          <FormError errors={state?.errors} name="passwordAgain" />
          <FormError
            errors={state?.errors}
            name="non_field_errors"
            className="text-red-500-dark"
          />
        </div>
        <div className="flex items-center">
          <Button variant="secondary" type="submit" disabled={isPending}>
            {t("changePasswordButton")}
          </Button>
          {isPending && <LoadingSpinner className="ml-2" size="1x" />}
        </div>
      </form>
    </div>
  );
};

export default PasswordReset;
