"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import { FC, useEffect, useTransition } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import { LoginActionState } from "@/app/(main)/accounts/actions";
import loginAction from "@/app/(main)/accounts/actions";
import { signInSchema, SignInSchema } from "@/app/(main)/accounts/schemas";
import SocialButtons from "@/components/auth/social_buttons";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

type SignInModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
};

const SignInModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
}: SignInModalType) => {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const { setUser } = useAuth();
  const { setCurrentModal } = useModal();
  const { register, watch } = useForm<SignInSchema>({
    resolver: zodResolver(signInSchema),
  });
  const [state, formAction] = useFormState<LoginActionState, FormData>(
    loginAction,
    null
  );
  useEffect(() => {
    if (!state) {
      return;
    }

    if (state.user) {
      sendGAEvent("event", "login");
      setUser(state.user);
      setCurrentModal(null);
    }

    if (
      state.errors &&
      state.errors.user_state &&
      state.errors.user_state == "inactive"
    ) {
      setCurrentModal(null);
      setCurrentModal({
        type: "accountInactive",
        data: { login: watch("login") },
      });
    }
  }, [setCurrentModal, setUser, state]);

  return (
    <BaseModal
      label={t("logIn")}
      isOpen={isOpen}
      onClose={onClose}
      className="mx-3 flex max-w-sm flex-col gap-2"
    >
      {(process.env.NEXT_PUBLIC_ALLOW_SIGNUP || "true")?.toLowerCase() ===
        "true" && (
        <div className="mb-4 text-base leading-tight">
          <span className="text-blue-900 dark:text-gray-1000-dark">
            {t("loginSignUpHeading")}{" "}
          </span>
          <Button
            variant="link"
            size="md"
            onClick={() => setCurrentModal({ type: "signup" })}
          >
            {t("createAnAccount")}
          </Button>
        </div>
      )}
      <form
        action={(data) => {
          startTransition(() => {
            formAction(data);
          });
        }}
        className="flex flex-col gap-4"
      >
        <Input
          autoComplete="username"
          className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
          type="text"
          placeholder={t("loginUsernamePlaceholder")}
          {...register("login")}
          errors={state?.errors}
        />
        <Input
          autoComplete="current-password"
          className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
          type="password"
          placeholder="password"
          {...register("password")}
          errors={state?.errors}
        />
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
