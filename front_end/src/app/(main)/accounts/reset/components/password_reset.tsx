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

export type PasswordResetProps = {
  user_id: number;
  token: string;
};

const PasswordReset: FC<PasswordResetProps> = ({ user_id, token }) => {
  const t = useTranslations();
  const { register } = useForm<PasswordResetConfirmSchema>({
    resolver: zodResolver(passwordResetConfirmSchema),
  });
  const [state, formAction] = useActionState<
    PasswordResetConfirmActionState,
    FormData
  >(passwordResetConfirmAction, null);

  return (
    <>
      <hr className="my-0" />
      <div className="flex items-center justify-between">
        <h2 className="my-4 text-2xl font-bold">{t("passwordResetHeading")}</h2>
      </div>
      <div>
        <form
          className="flex w-full flex-col gap-2 pb-4 text-sm"
          action={formAction}
        >
          <input
            type="hidden"
            defaultValue={user_id}
            {...register("user_id")}
          />
          <input type="hidden" defaultValue={token} {...register("token")} />
          <div>
            <div className="flex w-full items-center">
              <span className="w-[45%] pr-6 text-right">
                {t("newPasswordLabel")}
              </span>
              <div className="w-full max-w-44 justify-start">
                <Input
                  type="password"
                  className="w-full rounded border border-gray-500 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                  {...register("password")}
                />
              </div>
            </div>
            <div className="ml-[45%] w-full">
              <FormError errors={state?.errors} name="password" />
            </div>
          </div>
          <div>
            <div className="flex w-full items-center">
              <span className="w-[45%] pr-6 text-right">
                {t("verifyPasswordLabel")}
              </span>
              <div className="w-full max-w-44 justify-start">
                <Input
                  type="password"
                  className="w-full rounded border border-gray-500 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
                  {...register("passwordAgain")}
                />
              </div>
            </div>
            <div className="ml-[45%] w-full">
              <FormError errors={state?.errors} name="passwordAgain" />
              {/* Global errors container */}
              <FormError
                errors={state?.errors}
                name="non_field_errors"
                className="text-red-500-dark"
              />
            </div>
          </div>
          <div className="mt-4">
            <Button
              variant="secondary"
              type="submit"
              value="Submit"
              className="ml-[45%] w-full max-w-44"
            >
              {t("changePasswordButton")}
            </Button>
          </div>
        </form>
      </div>
    </>
  );
};

export default PasswordReset;
