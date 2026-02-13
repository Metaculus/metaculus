"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useCallback, useState } from "react";
import { useForm } from "react-hook-form";

import loginAction from "@/app/(main)/accounts/actions";
import { signInSchema, SignInSchema } from "@/app/(main)/accounts/schemas";
import SocialButtons from "@/components/auth/social_buttons";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { FormErrorMessage, Input } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { CurrentUser } from "@/types/users";
import { sendAnalyticsEvent } from "@/utils/analytics";

import usePostLoginActionHandler from "./hooks/usePostLoginActionHandler";

type SignInModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  onSuccess?: (authenticatedUser: CurrentUser) => void | Promise<void>;
};

const SignInModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
  onSuccess,
}: SignInModalType) => {
  const { PUBLIC_ALLOW_SIGNUP } = usePublicSettings();

  const t = useTranslations();
  const { setUser } = useAuth();
  const { setCurrentModal } = useModal();
  const handlePostLoginAction = usePostLoginActionHandler();
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>();

  const {
    formState: { errors },
    register,
    handleSubmit,
    resetField,
  } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
  });

  const onSubmit = useCallback(
    async (data: SignInSchema) => {
      setSubmitErrors(undefined);
      const state = await loginAction(data.login, data.password);

      if (state?.errors) {
        setSubmitErrors(state.errors);
        resetField("password");

        const isInactive =
          typeof state.errors === "object" &&
          "user_state" in state.errors &&
          (state.errors as { user_state?: string }).user_state === "inactive";

        if (isInactive) {
          setCurrentModal({
            type: "accountInactive",
            data: { login: data.login },
          });
        }
        return;
      }

      if (state?.user) {
        sendAnalyticsEvent("login");
        setUser(state.user);
        setCurrentModal(null);
        await onSuccess?.(state.user);
        handlePostLoginAction(state.postLoginAction);
      }
    },
    [setCurrentModal, setUser, handlePostLoginAction, onSuccess, resetField]
  );
  const [submit, isPending] = useServerAction(onSubmit);

  return (
    <BaseModal
      label={t("logIn")}
      isOpen={isOpen}
      onClose={onClose}
      className="mx-3 flex max-w-sm flex-col gap-2"
    >
      {PUBLIC_ALLOW_SIGNUP && (
        <div className="mb-4 text-base leading-tight">
          <span className="text-blue-900 dark:text-gray-1000-dark">
            {t("loginSignUpHeading")}{" "}
          </span>
          <Button
            variant="link"
            size="md"
            onClick={() =>
              setCurrentModal({ type: "signup", data: { onSuccess } })
            }
          >
            {t("createAnAccount")}
          </Button>
        </div>
      )}
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <Input
          autoComplete="username"
          className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 text-base dark:border-gray-700-dark"
          type="text"
          placeholder={t("loginUsernamePlaceholder")}
          {...register("login")}
          errors={errors.login}
        />
        <Input
          autoComplete="current-password"
          className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 text-base dark:border-gray-700-dark"
          type="password"
          placeholder="password"
          {...register("password")}
          errors={errors.password}
        />
        <FormErrorMessage errors={submitErrors} />
        <Button
          variant="primary"
          className="w-full"
          type="submit"
          disabled={isPending}
        >
          {t("logIn")}
        </Button>
      </form>
      <Button
        variant="text"
        className="w-full px-3 py-2"
        onClick={() => setCurrentModal({ type: "resetPassword" })}
      >
        {t("forgotPasswordLink")}
      </Button>
      <hr className="mb-3 mt-1 border-gray-300 dark:border-gray-300-dark" />
      <SocialButtons type="signin" />
    </BaseModal>
  );
};

export default SignInModal;
