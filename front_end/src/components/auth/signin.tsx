"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import { LoginActionState } from "@/app/accounts/actions";
import loginAction from "@/app/accounts/actions";
import { signInSchema, SignInSchema } from "@/app/accounts/schemas";
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
  const { setUser } = useAuth();
  const { setCurrentModal } = useModal();
  const { register } = useForm<SignInSchema>({
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
      setUser(state.user);
      setCurrentModal(null);
    }
  }, [setCurrentModal, setUser, state]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} variant="light">
      <div>
        <h2 className="mb-4	mr-3 mt-0 text-2xl text-blue-900 dark:text-blue-900-dark">
          {t("signInButton")}
        </h2>
        <p className="mb-6 mt-3 text-base leading-tight">
          {t("loginSignUpHeading")}
          <Button
            variant="link"
            size="md"
            onClick={() => setCurrentModal({ type: "signup" })}
          >
            {t("createAnAccount")}
          </Button>
        </p>
        <form action={formAction}>
          <Input
            autoComplete="username"
            className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
            type="text"
            placeholder={t("loginUsernamePlaceholder")}
            {...register("login")}
            errors={state?.errors}
          />
          <div className="text-xs text-red-500 dark:text-red-500-dark"></div>
          <Input
            autoComplete="current-password"
            className="mt-4 block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
            type="password"
            placeholder="password"
            {...register("password")}
            errors={state?.errors}
          />
          <div className="mb-4 text-xs text-red-500 dark:text-red-500-dark"></div>
          <Button variant="primary" className="w-full" type="submit">
            {t("signInButton")}
          </Button>
        </form>
        <Button
          variant="text"
          className="mt-2 w-full px-3 py-2"
          onClick={() => setCurrentModal({ type: "resetPassword" })}
        >
          {t("forgotPasswordLink")}
        </Button>
        <hr className="my-3 border-gray-300 dark:border-gray-300-dark" />
        <SocialButtons type="sigin" />
      </div>
    </BaseModal>
  );
};

export default SignInModal;
