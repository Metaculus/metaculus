"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import React, { FC, useCallback, useState } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { z } from "zod";

import { changeEmail } from "@/app/(main)/accounts/settings/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { FormErrorMessage, Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";

const contactUsSchema = z.object({
  email: z.string().min(1, { message: "Email is required" }),
  password: z.string().min(1, { message: "Password is required" }),
});
type ContactUsSchema = z.infer<typeof contactUsSchema>;

type Props = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
};

const ChangeEmailModal: FC<Props> = ({ isOpen, onClose }) => {
  const t = useTranslations();
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>();

  const {
    formState: { errors },
    register,
    handleSubmit,
    reset,
  } = useForm<ContactUsSchema>({
    resolver: zodResolver(contactUsSchema),
  });

  const handleClose = useCallback(
    (isOpen: boolean) => {
      reset();
      setSubmitErrors(undefined);
      onClose(isOpen);
    },
    [onClose, reset]
  );

  const onSubmit = useCallback(
    async ({ email, password }: ContactUsSchema) => {
      setSubmitErrors(undefined);
      const response = await changeEmail(email, password);
      if (response && "errors" in response && !!response.errors) {
        setSubmitErrors(response.errors);
      } else {
        handleClose(true);
        toast(t("settingsChangeEmailAddressSuccess"));
      }
    },
    [handleClose, t]
  );
  const [submit, isPending] = useServerAction(onSubmit);
  return (
    <>
      <BaseModal
        className="max-w-lg !overflow-y-auto"
        label={t("settingsChangeEmailAddress")}
        isOpen={isOpen}
        onClose={handleClose}
      >
        <div className="max-h-full w-full">
          <p className="my-6 text-base leading-tight">
            {t("settingsEmailChangeDescription")}
          </p>
          <form onSubmit={handleSubmit(submit)}>
            <Input
              className="mt-4 block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              placeholder={t("settingsNewEmail")}
              type="email"
              errors={errors.email}
              {...register("email")}
            />
            <Input
              className="mt-4 block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              placeholder={t("passwordPlaceholder")}
              type="password"
              errors={errors.password}
              {...register("password")}
            />
            <FormErrorMessage errors={submitErrors} />
            <div className="mt-4 flex items-center justify-end">
              {isPending && <LoadingSpinner className="mr-2" />}
              <Button variant="primary" type="submit" disabled={isPending}>
                {t("settingsChangeEmailAddress")}
              </Button>
            </div>
          </form>
        </div>
      </BaseModal>
    </>
  );
};

export default ChangeEmailModal;
