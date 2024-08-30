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
  const [isLoading, setIsLoading] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>();

  const {
    formState: { errors },
    register,
    handleSubmit,
  } = useForm<ContactUsSchema>({
    resolver: zodResolver(contactUsSchema),
  });

  const onSubmit = useCallback(
    async ({ email, password }: ContactUsSchema) => {
      setSubmitErrors(undefined);
      setIsLoading(true);
      try {
        const response = await changeEmail(email, password);
        if (response && "errors" in response && !!response.errors) {
          setSubmitErrors(response.errors);
        } else {
          onClose(true);
          toast(t("settingsChangeEmailAddressSuccess"));
        }
      } finally {
        setIsLoading(false);
      }
    },
    [onClose, t]
  );

  return (
    <>
      <BaseModal
        className="max-w-lg !overflow-y-auto"
        label={t("settingsChangeEmailAddress")}
        isOpen={isOpen}
        onClose={onClose}
      >
        <div className="max-h-full w-full">
          <p className="my-6 text-base leading-tight">
            {t("settingsEmailChangeDescription")}
          </p>
          <form onSubmit={handleSubmit(onSubmit)}>
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
            <div className="mt-4 text-right">
              <Button variant="primary" type="submit" disabled={isLoading}>
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
