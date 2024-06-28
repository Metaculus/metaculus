"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { FC, useEffect, useTransition } from "react";
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
import useTurnstileWidget from "@/hooks/use_turnstile";

type SignInModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
};

const SignUpModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
}: SignInModalType) => {
  const t = useTranslations();
  const { turnstileWidget, turnstileToken, turnstileResetWidget } =
    useTurnstileWidget();
  const [isPending, startTransition] = useTransition();
  const { setCurrentModal } = useModal();
  const { register, watch, setValue } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });
  const [state, formAction] = useFormState<SignUpActionState, FormData>(
    signUpAction,
    null
  );
  useEffect(() => {
    if (!state) {
      return;
    }

    turnstileResetWidget();

    if (!("errors" in state)) {
      setCurrentModal({
        type: "signupSuccess",
        data: { email: watch("email"), username: watch("username") },
      });
    }
  }, [turnstileResetWidget, setCurrentModal, watch, state]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose} variant="light">
      <div className="mt-6">
        <h2 className="mb-4	mr-3 mt-0 text-2xl text-blue-900 dark:text-blue-900-dark">
          {t("registrationHeadingSite")}
        </h2>
        <p className="mb-6 mt-3 text-base leading-tight">
          {t("registrationSignInHeading")}&nbsp;
          <Button
            variant="link"
            size="md"
            onClick={() => setCurrentModal({ type: "signin" })}
          >
            {t("signInButton")}
          </Button>
        </p>
        <div className="flex flex-col text-gray-900 dark:text-gray-900-dark sm:flex-row">
          <form
            action={(data) => {
              startTransition(() => {
                formAction(data);
              });
            }}
            className="flex flex-col gap-4 border-gray-300 dark:border-gray-700-dark sm:w-80 sm:border-r sm:pr-4"
          >
            <div>
              <Input
                autoComplete="username"
                className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
                placeholder={t("registrationUsernamePlaceholder")}
                type="text"
                errors={state?.errors}
                {...register("username")}
              />
            </div>
            <div>
              <Input
                autoComplete="new-password"
                className="block w-full rounded-b-none rounded-t border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
                placeholder={t("passwordPlaceholder")}
                type="password"
                errors={state?.errors}
                {...register("password")}
              />
              <Input
                autoComplete="new-password"
                className="block w-full rounded-b rounded-t-none border-x border-b border-t-0 border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
                placeholder={t("registrationVerifyPasswordPlaceholder")}
                type="password"
                errors={state?.errors}
                {...register("passwordAgain")}
              />
            </div>
            <div>
              <Input
                className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
                placeholder={t("registrationEmailPlaceholder")}
                type="email"
                errors={state?.errors}
                {...register("email")}
              />
            </div>
            <div>
              <Checkbox
                checked={watch("isBot")}
                onChange={(is_bot) => {
                  setValue("isBot", is_bot);
                }}
                label="Sign up as Bot"
                className="p-1.5"
              />
              <FormError errors={state?.errors} name="isBot" />
              <input type="hidden" {...register("isBot")} />
            </div>
            <div>
              <Button
                variant="primary"
                className="w-full"
                type="submit"
                disabled={isPending}
              >
                {t("createAnAccount")}
              </Button>
              <input
                type="hidden"
                defaultValue={turnstileToken}
                {...register("turnstileToken")}
              />
              <FormError errors={state?.errors} />
            </div>
            {turnstileWidget}
          </form>
          <div className="sm:w-80 sm:pl-4">
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
      </div>
    </BaseModal>
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
    <BaseModal isOpen={isOpen} onClose={onClose} variant="light">
      <div className="max-w-xs">
        <h2 className="mb-4	mr-3 mt-0 text-2xl text-blue-900 dark:text-blue-900-dark">
          {t("registrationSuccessHeading")}
        </h2>
        <div>
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
        </div>
      </div>
    </BaseModal>
  );
};

export default SignUpModal;
