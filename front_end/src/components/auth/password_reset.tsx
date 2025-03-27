"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useEffect, useTransition, useActionState } from "react";
import { useForm } from "react-hook-form";

import {
  passwordResetRequestAction,
  PasswordResetRequestActionState,
} from "@/app/(main)/accounts/reset/actions";
import {
  PasswordResetRequestSchema,
  passwordResetRequestSchema,
} from "@/app/(main)/accounts/schemas";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form_field";
import { useModal } from "@/contexts/modal_context";

type SignInModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
};

export const ResetPasswordConfirmModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
}: SignInModalType) => {
  const t = useTranslations();

  return (
    <BaseModal
      label={t("resetPasswordEmailSentHeading")}
      isOpen={isOpen}
      onClose={onClose}
      className="max-w-sm text-sm leading-tight"
    >
      <p>{t("resetPasswordEmailSent1")}</p>
      <p>{t("resetPasswordEmailSent2")}</p>
    </BaseModal>
  );
};

const ResetPasswordModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
}: SignInModalType) => {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const { setCurrentModal } = useModal();
  const { register } = useForm<PasswordResetRequestSchema>({
    resolver: zodResolver(passwordResetRequestSchema),
  });
  const [state, formAction] = useActionState<
    PasswordResetRequestActionState,
    FormData
  >(passwordResetRequestAction, null);
  useEffect(() => {
    if (state && !state.errors) {
      setCurrentModal({ type: "resetPasswordConfirm" });
    }
  }, [setCurrentModal, state]);

  return (
    <BaseModal
      label={t("passwordResetHeading")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <form
        action={(data) => {
          startTransition(() => {
            formAction(data);
          });
        }}
        className="flex max-w-xs flex-col gap-4"
      >
        {t("passwordResetDescription")}
        <Input
          className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
          type="text"
          placeholder={t("loginUsernamePlaceholder")}
          {...register("login")}
          errors={state?.errors}
        />
        <FormError errors={state?.errors}></FormError>
        <Button
          variant="primary"
          className="w-full"
          type="submit"
          disabled={isPending}
        >
          {t("resetPasswordButton")}
        </Button>
      </form>
    </BaseModal>
  );
};

export default ResetPasswordModal;
