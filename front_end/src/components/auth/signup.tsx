"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, useEffect } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import { signUpAction, SignUpActionState } from "@/app/accounts/actions";
import { SignUpSchema, signUpSchema } from "@/app/accounts/schemas";
import SocialButtons from "@/components/auth/social_buttons";
import BaseModal from "@/components/base_modal";
import { Input } from "@/components/form_field";
import Button from "@/components/ui/button";
import { useModal } from "@/contexts/modal_context";

type SignInModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
};

const SignUpModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
}: SignInModalType) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const { register, watch } = useForm<SignUpSchema>({
    resolver: zodResolver(signUpSchema),
  });
  const [state, formAction] = useFormState<SignUpActionState, FormData>(
    signUpAction,
    null
  );
  useEffect(() => {
    if (state && !("errors" in state)) {
      setCurrentModal({
        type: "signupSuccess",
        data: { email: watch("email"), username: watch("username") },
      });
    }
  }, [setCurrentModal, watch, state]);

  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div>
        <h2 className="mb-4	mr-3 mt-0 text-2xl text-metac-blue-900 dark:text-metac-blue-900-dark">
          {t("registrationHeadingSite")}
        </h2>
        <p className="mb-6 mt-3 text-base leading-tight">
          {t("registrationSignInHeading")}
          <Button
            variant="link"
            size="md"
            onClick={() => setCurrentModal({ type: "signin" })}
          >
            {t("signInButton")}
          </Button>
        </p>
        <div className="flex flex-col text-metac-gray-900 sm:flex-row dark:text-metac-gray-900-dark">
          <form
            action={formAction}
            className="flex flex-col gap-4 border-metac-gray-300 sm:w-80 sm:border-r sm:pr-4 dark:border-metac-gray-700-dark"
          >
            <Input
              autoComplete="username"
              className="block w-full rounded border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
              placeholder={t("registrationUsernamePlaceholder")}
              type="text"
              errors={state?.errors}
              {...register("username")}
            />
            <div>
              <Input
                autoComplete="new-password"
                className="block w-full rounded-t border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
                placeholder={t("passwordPlaceholder")}
                type="password"
                errors={state?.errors}
                {...register("password")}
              />
              <Input
                autoComplete="new-password"
                className="block w-full rounded-b border-x border-b border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
                placeholder={t("registrationVerifyPasswordPlaceholder")}
                type="password"
                errors={state?.errors}
                {...register("passwordAgain")}
              />
            </div>
            <Input
              className="block w-full rounded border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
              placeholder={t("registrationEmailPlaceholder")}
              type="email"
              errors={state?.errors}
              {...register("email")}
            />
            <div className="text-xs text-metac-red-500 dark:text-metac-red-500-dark"></div>
            <Button variant="primary" className="w-full" type="submit">
              {t("createAnAccount")}
            </Button>
          </form>
          <div className="sm:w-80 sm:pl-4">
            <ul className="hidden leading-tight sm:block">
              <li className="mb-3 flex">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-metac-olive-700 dark:text-metac-olive-700-dark"
                />
                <span className="ml-4">{t("registrationInfoAbility1")}</span>
              </li>
              <li className="mb-3 flex">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-metac-olive-700 dark:text-metac-olive-700-dark"
                />
                <span className="ml-4">{t("registrationInfoAbility2")}</span>
              </li>
              <li className="mb-3 flex">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-metac-olive-700 dark:text-metac-olive-700-dark"
                />
                <span className="ml-4">{t("registrationInfoAbility3")}</span>
              </li>
              <li className="mb-3 flex">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-metac-olive-700 dark:text-metac-olive-700-dark"
                />
                <span className="ml-4">{t("registrationInfoAbility4")}</span>
              </li>
              <li className="mb-3 flex">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-metac-olive-700 dark:text-metac-olive-700-dark"
                />
                <span className="ml-4">{t("registrationInfoAbility5")}</span>
              </li>
            </ul>
            <hr className="my-6 border-metac-gray-300 sm:hidden dark:border-metac-gray-300-dark" />
            <SocialButtons type="signup" />
          </div>
        </div>
        <div className="mt-6 text-center text-metac-gray-700 dark:text-metac-gray-700-dark">
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
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="max-w-sm">
        <h2 className="mb-4	mr-3 mt-0 text-2xl text-metac-blue-900 dark:text-metac-blue-900-dark">
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
