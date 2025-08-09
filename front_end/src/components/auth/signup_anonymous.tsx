"use client";

import { isNil } from "lodash";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC } from "react";
import { useForm } from "react-hook-form";

import { signUpAnonymousAction } from "@/app/(main)/accounts/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { FormError } from "@/components/ui/form_field";
import { useModal } from "@/contexts/modal_context";
import { useServerAction } from "@/hooks/use_server_action";
import { sendAnalyticsEvent } from "@/utils/analytics";

import usePostLoginActionHandler from "./hooks/usePostLoginActionHandler";

type SignUpAnonymousModalProps = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
  className?: string;
  projectId?: number;
};

type ServerErrorShape = Record<string, string[] | string>;

const AnonymousSignupForm: FC<{ projectId: number }> = ({ projectId }) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const handlePostLoginAction = usePostLoginActionHandler();

  const { handleSubmit, formState, setError, clearErrors } = useForm();

  const onSubmit = async () => {
    clearErrors();

    const response = await signUpAnonymousAction({ projectId });

    const srvErrors: ServerErrorShape | undefined = response?.errors;
    if (srvErrors) {
      const firstMessage =
        Object.values(srvErrors)
          .flat()
          .map((m) => (Array.isArray(m) ? m[0] : m))
          .filter(Boolean)[0] || "Unknown Error";

      setError("root", { type: "server", message: String(firstMessage) });
      return response;
    }

    sendAnalyticsEvent("register", {
      event_category: new URLSearchParams(window.location.search).toString(),
    });

    setCurrentModal(null);
    handlePostLoginAction(response?.postLoginAction);
    return response;
  };

  const [submit, isPending] = useServerAction(onSubmit);

  const errors = formState.errors.root?.message
    ? { form: formState.errors.root.message as string }
    : {};

  return (
    <form
      onSubmit={handleSubmit(submit)}
      className="flex flex-col gap-3 sm:w-96"
    >
      <p className="text-sm leading-normal text-gray-800 dark:text-gray-200">
        {t.rich("anonymousTournamentCookieConsent", {
          strong: (chunks) => <strong>{chunks}</strong>,
        })}{" "}
        <br />
        {t("clickIAgreeToForecast")}
      </p>

      <div className="flex items-center gap-3">
        <Button
          variant="primary"
          size="sm"
          className="w-auto px-4 py-1.5"
          type="submit"
          disabled={isPending}
        >
          {t("iAgree")}
        </Button>
      </div>
      <p>
        {t("signUpInstead")}
        <Button
          type="button"
          variant="link"
          size="sm"
          onClick={() => setCurrentModal({ type: "signup" })}
          className="p-0 align-baseline"
        >
          {t("here")}
        </Button>
        .
      </p>

      <div aria-live="polite">
        <FormError errors={errors} />
      </div>
    </form>
  );
};

export const SignUpAnonymousModal: FC<SignUpAnonymousModalProps> = ({
  isOpen,
  onClose,
  projectId,
}) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();

  if (isNil(projectId)) return null;

  return (
    <BaseModal
      className="mx-3"
      label={t("anonymousRegistrationHeading")}
      isOpen={isOpen}
      onClose={onClose}
    >
      <div className="mb-6 text-base leading-tight">
        {t("registrationSignInHeading")}{" "}
        <Button
          variant="link"
          size="md"
          onClick={() => setCurrentModal({ type: "signin" })}
        >
          {t("logIn")}
        </Button>
      </div>

      <div className="border-gray-300 dark:border-gray-300-dark sm:pr-4">
        <AnonymousSignupForm projectId={projectId} />
      </div>

      <div className="mt-6 text-center text-gray-700 dark:text-gray-700-dark">
        {t.rich("anonymousRegistrationTerms", {
          terms: (chunks) => (
            <Link target="_blank" href="/terms-of-use/">
              {chunks}
            </Link>
          ),
          privacy: (chunks) => (
            <Link target="_blank" href="/privacy-policy/">
              {chunks}
            </Link>
          ),
        })}
      </div>
    </BaseModal>
  );
};
