"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import {
  passwordResetRequestAction,
  PasswordResetRequestActionState,
} from "@/app/accounts/reset/actions";
import {
  PasswordResetRequestSchema,
  passwordResetRequestSchema,
} from "@/app/accounts/schemas";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form_field";
import { useModal } from "@/contexts/modal_context";

type SignInModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
};

const ResetPasswordModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
}: SignInModalType) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const { register } = useForm<PasswordResetRequestSchema>({
    resolver: zodResolver(passwordResetRequestSchema),
  });
  const [state, formAction] = useFormState<
    PasswordResetRequestActionState,
    FormData
  >(passwordResetRequestAction, null);
  useEffect(() => {
    if (state && !state.errors) {
      setCurrentModal({ type: "resetPasswordConfirm" });
    }
  }, [setCurrentModal, state]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} variant="light">
      <div className="max-w-xs">
        <h2 className="mb-4	mr-3 mt-0 text-2xl text-metac-blue-900 dark:text-metac-blue-900-dark">
          {t("passwordResetHeading")}
        </h2>
        <p className="mb-6 mt-3 text-center text-base leading-tight">
          {t("passwordResetDescription")}
        </p>
        <form action={formAction}>
          <Input
            className="block w-full rounded border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
            type="text"
            placeholder={t("loginUsernamePlaceholder")}
            {...register("login")}
            errors={state?.errors}
          />
          <FormError errors={state?.errors}></FormError>
          <div className="text-xs text-metac-red-500 dark:text-metac-red-500-dark"></div>
          <Button variant="primary" className="mt-4 w-full" type="submit">
            {t("resetPasswordButton")}
          </Button>
        </form>
      </div>
    </BaseModal>
  );
};

export const ResetPasswordConfirmModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
}: SignInModalType) => {
  const t = useTranslations();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} variant="light">
      <div className="max-w-sm">
        <h2 className="mb-4	mr-3 mt-0 text-2xl text-metac-blue-900 dark:text-metac-blue-900-dark">
          {t("resetPasswordEmailSentHeading")}
        </h2>
        <p className="mb-2 text-sm leading-tight">
          {t("resetPasswordEmailSent1")}
        </p>
        <p className="text-sm leading-tight">{t("resetPasswordEmailSent2")}</p>
      </div>
    </BaseModal>
  );
};

export default ResetPasswordModal;
