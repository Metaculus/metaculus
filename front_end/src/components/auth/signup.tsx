"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { sendGAEvent } from "@next/third-parties/google";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC, useEffect, useRef, useState, useTransition } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import { signUpAction, SignUpActionState } from "@/app/(main)/accounts/actions";
import { SignUpSchema, signUpSchema } from "@/app/(main)/accounts/schemas";
import SocialButtons from "@/components/auth/social_buttons";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { FormError, Input } from "@/components/ui/form_field";
import { useModal } from "@/contexts/modal_context";

type SignInModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
};

const TURNSTILE_SITE_KEY = process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY;

export const SignupForm: FC<{
  forceIsBot?: boolean | "ask";
  addToProject?: number;
}> = ({ forceIsBot = "ask", addToProject }) => {
  const t = useTranslations();
  const [isPending, startTransition] = useTransition();
  const [isTurnstileValidated, setIsTurnstileValidate] = useState(false);
  const { setCurrentModal } = useModal();
  const { register, watch, setValue } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
    defaultValues: {
      isBot: forceIsBot !== "ask" ? forceIsBot : undefined,
    },
  });
  const turnstileRef = useRef<TurnstileInstance | undefined>();

  const [state, formAction] = useFormState<SignUpActionState, FormData>(
    signUpAction,
    null
  );
  useEffect(() => {
    if (!state) {
      return;
    }

    if (!("errors" in state)) {
      sendGAEvent("event", "register", {
        event_category: new URLSearchParams(window.location.search).toString(),
      });
      setCurrentModal({
        type: "signupSuccess",
        data: { email: watch("email"), username: watch("username") },
      });
    } else {
      turnstileRef.current?.reset();
    }

    forceIsBot !== "ask" && setValue("isBot", forceIsBot);
  }, [setCurrentModal, watch, state, forceIsBot]);

  return (
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
        placeholder={t("registrationUsernamePlaceholder")}
        type="text"
        errors={state?.errors}
        {...register("username")}
      />
      <div>
        <Input
          autoComplete="new-password"
          className="block w-full rounded-b-none rounded-t border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
          placeholder={t("passwordPlaceholder")}
          type="password"
          {...register("password")}
        />
        <Input
          autoComplete="new-password"
          className="block w-full rounded-b rounded-t-none border-x border-b border-t-0 border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
          placeholder={t("registrationVerifyPasswordPlaceholder")}
          type="password"
          {...register("passwordAgain")}
        />
        <FormError errors={state?.errors} name={"password"} />
      </div>
      <Input
        className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
        placeholder={t("registrationEmailPlaceholder")}
        type="email"
        errors={state?.errors}
        {...register("email")}
      />
      {forceIsBot == null && (
        <Checkbox
          checked={watch("isBot")}
          onChange={(is_bot) => {
            setValue("isBot", is_bot);
          }}
          label={t("signUpAsBot")}
          className="p-1.5"
        />
      )}
      <FormError errors={state?.errors} name="isBot" />
      <input type="hidden" {...register("isBot")} />
      {addToProject && (
        <input
          type="hidden"
          {...register("addToProject")}
          value={addToProject}
        />
      )}
      <div>
        <Button
          variant="primary"
          className="w-full"
          type="submit"
          disabled={isPending || !isTurnstileValidated}
        >
          {t("createAnAccount")}
        </Button>
        <FormError
          errors={state?.errors}
          name={TURNSTILE_SITE_KEY ? "" : "turnstileToken"}
        />
      </div>
      {TURNSTILE_SITE_KEY && (
        <Turnstile
          ref={turnstileRef}
          siteKey={TURNSTILE_SITE_KEY}
          options={{
            responseFieldName: "turnstileToken",
          }}
          onSuccess={() => setIsTurnstileValidate(true)}
          onError={() => setIsTurnstileValidate(false)}
          onExpire={() => setIsTurnstileValidate(false)}
        />
      )}
    </form>
  );
};

type SignUpModalSuccessProps = SignInModalType & {
  username: string;
  email: string;
};

export const SignUpModalSuccess: FC<SignUpModalSuccessProps> = ({
  isOpen,
  onClose,
  username,
  email,
}: SignUpModalSuccessProps) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="max-w-xs">
      <h2 className="mb-4	mr-3 mt-0 text-2xl text-blue-900 dark:text-blue-900-dark">
        {t("registrationSuccessHeading")}
      </h2>
      <p>
        {t.rich("registrationSuccess1", {
          username: () => <b>{username}</b>,
        })}
      </p>
      <p>
        {t.rich("registrationSuccess2", {
          email: () => <b>{email}</b>,
        })}
      </p>
    </BaseModal>
  );
};

const SignUpModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
}: SignInModalType) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  return (
    <BaseModal
      label={t("registrationHeadingSite")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="mb-6 text-base leading-tight">
        {t("registrationSignInHeading")}&nbsp;
        <Button
          variant="link"
          size="md"
          onClick={() => setCurrentModal({ type: "signin" })}
        >
          {t("logIn")}
        </Button>
      </div>
      <div className="flex flex-col text-gray-900 dark:text-gray-900-dark sm:flex-row">
        <div className="border-gray-300 dark:border-gray-300-dark sm:w-80 sm:border-r sm:pr-4">
          <SignupForm />
        </div>
        <div className="flex flex-col gap-2 sm:w-80 sm:pl-4">
          <ul className="hidden leading-tight sm:block">
            <li className="mb-3 flex">
              <FontAwesomeIcon
                icon={faCheck}
                className="text-olive-700 dark:text-olive-700-dark"
              />
              <span className="ml-4">{t("registrationInfoAbility1")}</span>
            </li>
            <li className="mb-3 flex">
              <FontAwesomeIcon
                icon={faCheck}
                className="text-olive-700 dark:text-olive-700-dark"
              />
              <span className="ml-4">{t("registrationInfoAbility2")}</span>
            </li>
            <li className="mb-3 flex">
              <FontAwesomeIcon
                icon={faCheck}
                className="text-olive-700 dark:text-olive-700-dark"
              />
              <span className="ml-4">{t("registrationInfoAbility3")}</span>
            </li>
            <li className="mb-3 flex">
              <FontAwesomeIcon
                icon={faCheck}
                className="text-olive-700 dark:text-olive-700-dark"
              />
              <span className="ml-4">{t("registrationInfoAbility4")}</span>
            </li>
            <li className="mb-3 flex">
              <FontAwesomeIcon
                icon={faCheck}
                className="text-olive-700 dark:text-olive-700-dark"
              />
              <span className="ml-4">{t("registrationInfoAbility5")}</span>
            </li>
          </ul>
          <hr className="my-6 border-gray-300 dark:border-gray-300-dark sm:hidden" />
          <SocialButtons type="signup" />
        </div>
      </div>
      <div className="mt-6 text-center text-gray-700 dark:text-gray-700-dark">
        {t.rich("registrationTerms", {
          terms: (chunks) => (
            <Link target="_blank" href={"/terms-of-use/"}>
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link target="_blank" href={"/privacy-policy/"}>
              {chunks}
            </Link>
          ),
        })}
      </div>
    </BaseModal>
  );
};

export default SignUpModal;
