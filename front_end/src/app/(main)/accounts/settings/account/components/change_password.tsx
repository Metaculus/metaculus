"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { changePassword } from "@/app/(main)/accounts/settings/actions";
import Button from "@/components/ui/button";
import { FormErrorMessage, Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";

export const changePasswordSchema = z
  .object({
    password: z.string().min(1, { message: "Current password is required" }),
    new_password: z.string().min(1, { message: "New Password is required" }),
    password_again: z.string().min(1, { message: "Password is required" }),
  })
  .superRefine(({ password_again, new_password }, ctx) => {
    if (password_again !== new_password) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        message: "The passwords did not match",
        path: ["password_again"],
      });
    }
  });
export type ChangePasswordSchema = z.infer<typeof changePasswordSchema>;

const ChangePassword: FC = () => {
  const t = useTranslations();
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>();

  const {
    formState: { errors },
    register,
    handleSubmit,
    reset,
  } = useForm<ChangePasswordSchema>({
    resolver: zodResolver(changePasswordSchema),
  });

  const onSubmit = useCallback(
    async (data: ChangePasswordSchema) => {
      try {
        const response = await changePassword(data.password, data.new_password);
        if (response && "errors" in response && !!response.errors) {
          setSubmitErrors(response.errors);
        } else {
          reset();
          setSubmitErrors(undefined);
          toast(t("passwordChangeSuccess"));
        }
      } finally {
      }
    },
    [reset, t]
  );
  const [submit, isPending] = useServerAction(onSubmit);
  return (
    <section>
      <hr className="my-6 border-gray-400 dark:border-gray-400-dark" />
      <div className="mb-4 text-gray-500 dark:text-gray-500-dark">
        {t("changePasswordButton")}
      </div>
      <div className="grid md:grid-cols-2">
        <form className="flex flex-col gap-4" onSubmit={handleSubmit(submit)}>
          <div>
            <Input
              className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              placeholder={t("currentPasswordPlaceholder")}
              type="password"
              errors={errors.password}
              {...register("password")}
            />
          </div>

          <div>
            <Input
              className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              placeholder={t("newPasswordPlaceholder")}
              type="password"
              errors={errors.new_password}
              {...register("new_password")}
            />
          </div>

          <div>
            <Input
              className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              placeholder={t("verifyPasswordPlaceholder")}
              type="password"
              errors={errors.password_again}
              {...register("password_again")}
            />
          </div>
          <FormErrorMessage errors={submitErrors} />

          <div className="flex items-center">
            <Button variant="secondary" type="submit" disabled={isPending}>
              {t("updatePasswordButton")}
            </Button>
            {isPending && <LoadingSpinner className="ml-2" size="1x" />}
          </div>
        </form>
      </div>
    </section>
  );
};

export default ChangePassword;
