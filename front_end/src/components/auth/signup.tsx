"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, useRef, useState } from "react";
import { FormProvider, useForm, useFormContext } from "react-hook-form";

import { signUpAction, SignUpActionState } from "@/app/(main)/accounts/actions";
import { firstErrorFor } from "@/app/(main)/accounts/helpers";
import {
  SignUpSchema,
  generateSignUpSchema,
} from "@/app/(main)/accounts/schemas";
import SocialButtons from "@/components/auth/social_buttons";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import Checkbox from "@/components/ui/checkbox";
import { FormError, Input } from "@/components/ui/form_field";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import useAppTheme from "@/hooks/use_app_theme";
import { useServerAction } from "@/hooks/use_server_action";
import { AppTheme } from "@/types/theme";
import { sendAnalyticsEvent } from "@/utils/analytics";

import usePostLoginActionHandler from "./hooks/usePostLoginActionHandler";

type SignInModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  className?: string;
};

export const SignupForm: FC<{
  forceIsBot?: boolean;
  addToProject?: number;
  email?: string;
  inviteToken?: string;
  withNewsletterOptin?: boolean;
}> = ({
  forceIsBot,
  addToProject,
  email,
  inviteToken,
  withNewsletterOptin,
}) => {
  const t = useTranslations();
  const { themeChoice } = useAppTheme();
  const { PUBLIC_TURNSTILE_SITE_KEY } = usePublicSettings();
  const [isTurnstileValidated, setIsTurnstileValidate] =
    // Treat as validated if project is not configured with Turnstile key
    useState(!PUBLIC_TURNSTILE_SITE_KEY);
  const { setCurrentModal } = useModal();
  const turnstileRef = useRef<TurnstileInstance | null>(null);

  const methods = useForm<SignUpSchema>({
    resolver: zodResolver(generateSignUpSchema(PUBLIC_TURNSTILE_SITE_KEY)),
    defaultValues: {
      email,
      isBot: forceIsBot ?? false,
      addToProject,
      inviteToken,
      // We use undefined when the form doesn't have the newsletter optin checkbox - means the user is not making a choice here.
      newsletterOptin: withNewsletterOptin ? false : undefined,
    },
  });

  const currentLocation = usePathname();

  const { watch, setValue, formState, handleSubmit, setError, clearErrors } =
    methods;

  const handlePostLoginAction = usePostLoginActionHandler();

  const onSubmit = async (data: SignUpSchema) => {
    const response = await signUpAction({
      ...data,
      redirectUrl: currentLocation,
      newsletterOptin: watch("newsletterOptin"),
      appTheme: (Object.values(AppTheme) as string[]).includes(
        themeChoice ?? ""
      )
        ? (themeChoice as AppTheme)
        : AppTheme.System,
    });

    if (response && response.errors) {
      let error;
      for (error in response.errors)
        setError(error as keyof SignUpSchema, {
          type: "custom",
          message: firstErrorFor(response.errors, error),
        });
    }

    if (response?.errors) {
      turnstileRef.current?.reset();
    } else {
      sendAnalyticsEvent("register", {
        event_category: new URLSearchParams(window.location.search).toString(),
        signupPath: currentLocation,
      });
      if (response?.is_active) {
        setCurrentModal(null);
      } else {
        setCurrentModal({
          type: "signupSuccess",
          data: { email: watch("email"), username: watch("username") },
        });
      }
      handlePostLoginAction(response?.postLoginAction);
    }

    return response;
  };
  const [submit, isPending] = useServerAction(onSubmit);

  const errors = Object.keys(formState.errors).reduce((errorsAcc, error) => {
    const key = error as keyof typeof formState.errors;
    return {
      ...errorsAcc,
      [key]: formState.errors[key]?.message,
    };
  }, {});

  return (
    <FormProvider {...methods}>
      <form onSubmit={handleSubmit(submit)} className="flex flex-col gap-4">
        <SignUpFormFragment
          errors={errors}
          forceIsBot={forceIsBot}
          disableEmail={!!email}
          withNewsletterOptin={withNewsletterOptin}
        />
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
            errors={errors}
            name={PUBLIC_TURNSTILE_SITE_KEY ? "" : "turnstileToken"}
          />
          <FormError errors={errors} />
        </div>
        {PUBLIC_TURNSTILE_SITE_KEY && (
          <Turnstile
            ref={turnstileRef}
            siteKey={PUBLIC_TURNSTILE_SITE_KEY}
            onSuccess={(token) => {
              setIsTurnstileValidate(true);
              setValue("turnstileToken", token);
              clearErrors("turnstileToken");
            }}
            onError={() => setIsTurnstileValidate(false)}
            onExpire={() => setIsTurnstileValidate(false)}
          />
        )}
      </form>
    </FormProvider>
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

type AccountInactiveModalProps = SignInModalType & {
  login: string;
};

export const AccountInactive: FC<AccountInactiveModalProps> = ({
  isOpen,
  onClose,
  login,
}: AccountInactiveModalProps) => {
  const t = useTranslations();

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} className="max-w-xs">
      <h2 className="mb-4	mr-3 mt-0 text-2xl text-blue-900 dark:text-blue-900-dark">
        {t("accountInactiveModalTitle")}
      </h2>
      <p>
        {t.rich("accountInactiveModalBody", {
          login,
          bold: (chunks) => <b>{chunks}</b>,
        })}
      </p>
    </BaseModal>
  );
};

export const SignUpModal: FC<SignInModalType & { forceIsBot?: boolean }> = ({
  isOpen,
  onClose,
  forceIsBot,
}) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  return (
    <BaseModal
      className="mx-3"
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
          <SignupForm withNewsletterOptin={true} forceIsBot={forceIsBot} />
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
            <li className="mb-3 flex">
              <FontAwesomeIcon
                icon={faCheck}
                className="text-olive-700 dark:text-olive-700-dark"
              />
              <span className="ml-4">{t("registrationInfoAbility6")}</span>
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

const SignUpFormFragment: FC<{
  forceIsBot?: boolean;
  errors: NonNullable<SignUpActionState>["errors"];
  disableEmail?: boolean;
  withNewsletterOptin?: boolean;
}> = ({
  forceIsBot = undefined,
  errors,
  disableEmail = false,
  withNewsletterOptin = false,
}) => {
  const { register, setValue, watch } = useFormContext();
  const t = useTranslations();
  return (
    <>
      <Input
        autoComplete="username"
        className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 text-base dark:border-gray-700-dark"
        placeholder={t("registrationUsernamePlaceholder")}
        type="text"
        errors={errors}
        {...register("username")}
      />
      <div>
        <Input
          autoComplete="new-password"
          className="block w-full rounded-b-none rounded-t border border-gray-700 bg-inherit px-3 py-2 text-base dark:border-gray-700-dark"
          placeholder={t("passwordPlaceholder")}
          type="password"
          {...register("password")}
        />
        <Input
          autoComplete="new-password"
          className="block w-full rounded-b rounded-t-none border-x border-b border-t-0 border-gray-700 bg-inherit px-3 py-2 text-base dark:border-gray-700-dark"
          placeholder={t("registrationVerifyPasswordPlaceholder")}
          type="password"
          {...register("passwordAgain")}
        />
        <FormError errors={errors} name={"password"} />
      </div>
      <Input
        className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 text-base dark:border-gray-700-dark"
        placeholder={t("registrationEmailPlaceholder")}
        type="email"
        errors={errors}
        disabled={disableEmail}
        {...register("email")}
      />
      {forceIsBot === null && (
        <Checkbox
          checked={watch("isBot")}
          onChange={(is_bot) => {
            setValue("isBot", is_bot);
          }}
          label={t("signUpAsBot")}
          className="p-1.5"
        />
      )}
      <FormError errors={errors} name="isBot" />
      <input type="hidden" {...register("isBot")} />
      {withNewsletterOptin && (
        <Checkbox
          checked={watch("newsletterOptin")}
          onChange={(newsletterOptin) => {
            setValue("newsletterOptin", newsletterOptin);
          }}
          label={t("signUpNewsletterOptin")}
        />
      )}
    </>
  );
};
