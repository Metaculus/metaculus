"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import * as z from "zod";

import { inviteUsers } from "@/app/(main)/accounts/actions";
import Button from "@/components/ui/button";
import { FormErrorMessage, Textarea } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import { logError } from "@/utils/core/errors";

const createSchema = () => {
  return z.object({
    emails: z
      .string()
      .min(1, { message: "Emails are required" })
      .transform((str) => str.split("\n").map((email) => email.trim())),
  });
};
type ReportSchema = z.infer<ReturnType<typeof createSchema>>;

const InviteForm: FC = () => {
  const [submitError, setSubmitError] = useState<
    (Error & { digest?: string }) | undefined
  >();
  const t = useTranslations();
  const [isLoading, setIsLoading] = useState(false);

  const reportSchema = createSchema();
  const { register, handleSubmit, reset, formState, clearErrors } =
    useForm<ReportSchema>({
      mode: "all",
      resolver: zodResolver(reportSchema),
    });

  const onSubmit = useCallback(
    async (values: ReportSchema) => {
      setIsLoading(true);

      try {
        await inviteUsers(values.emails);
        reset();
        toast(t("signupInviteSuccess"));
        clearErrors();
      } catch (e) {
        logError(e);
        const error = e as Error & { digest?: string };
        setSubmitError(error);
      } finally {
        setIsLoading(false);
      }
    },
    [reset, t]
  );

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="mt-8 flex w-full flex-col gap-6"
    >
      <InputContainer
        labelText={t("signupInviteEmailAddresses")}
        explanation={t("signupInviteEmailAddressesPlaceholder")}
      >
        <div className="relative m-auto w-full flex-col">
          <Textarea
            className="min-h-36 w-full rounded border border-gray-500 p-5 font-normal dark:border-gray-500-dark dark:bg-blue-50-dark"
            errors={formState.errors.emails}
            {...register("emails")}
          />
        </div>
      </InputContainer>
      <div className="flex-col">
        <div className="m-2">
          {!isLoading && <FormErrorMessage errors={submitError} />}
        </div>
        <Button
          type="submit"
          variant="primary"
          className="w-max capitalize"
          disabled={isLoading}
        >
          {t("signupInviteSendButton")}
        </Button>
      </div>
    </form>
  );
};

export default InviteForm;
