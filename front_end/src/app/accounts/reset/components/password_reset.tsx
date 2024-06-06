"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import {
  passwordResetConfirmAction,
  PasswordResetConfirmActionState,
} from "@/app/accounts/actions";
import {
  PasswordResetConfirmSchema,
  passwordResetConfirmSchema,
} from "@/app/accounts/schemas";
import Button from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form_field";
import Hr from "@/components/ui/hr";

export type PasswordResetProps = {
  user_id: number;
  token: string;
};

const PasswordReset: FC<PasswordResetProps> = ({ user_id, token }) => {
  const t = useTranslations();
  const { register } = useForm<PasswordResetConfirmSchema>({
    resolver: zodResolver(passwordResetConfirmSchema),
  });
  const [state, formAction] = useFormState<
    PasswordResetConfirmActionState,
    FormData
  >(passwordResetConfirmAction, null);

  return (
    <>
      <Hr className="my-0" />
      <div className="flex items-center justify-between">
        <h2 className="my-4 text-2xl font-bold">{t("passwordResetHeading")}</h2>
      </div>
      <div>
        <form className="flex w-full flex-col pb-4 text-sm" action={formAction}>
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
                  className="w-full border border-metac-gray-600-dark bg-metac-blue-100 px-[5px] py-[3px]"
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
                  className="w-full border border-t-0 border-metac-gray-600-dark bg-metac-blue-100 px-[5px] py-[3px]"
                  {...register("passwordAgain")}
                />
              </div>
            </div>
            <div className="ml-[45%] w-full">
              <FormError errors={state?.errors} name="passwordAgain" />
            </div>
          </div>
          {/* Global errors container */}
          <FormError
            errors={state?.errors}
            name="non_field_errors"
            className="text-metac-red-500-dark"
          />
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
      <FormError errors={state?.errors} name={"non_field_errors"} />
    </>
  );
};

export default PasswordReset;
