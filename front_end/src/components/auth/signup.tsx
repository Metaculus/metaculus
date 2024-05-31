"use client";

import { faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { zodResolver } from "@hookform/resolvers/zod";
import { FC, useEffect } from "react";
import { useFormState } from "react-dom";
import { useForm } from "react-hook-form";

import { signUpAction, SignUpActionState } from "@/app/accounts/actions";
import { SignUpSchema, signUpSchema } from "@/app/accounts/schemas";
import SocialButtons from "@/components/auth/social_buttons";
import BaseModal from "@/components/base_modal";
import { Input } from "@/components/form_field";
import { useModal } from "@/contexts/modal_context";

type SignInModalType = {
  isOpen: boolean;
  onClose: (isOpen: boolean) => void;
};

const SignUpModal: FC<SignInModalType> = ({
  isOpen,
  onClose,
}: SignInModalType) => {
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
          Create a Metaculus Account
        </h2>
        <p className="mb-6 mt-3 text-base leading-tight">
          Already have an account?
          <button
            className="inline-flex items-center justify-center gap-2 rounded-full text-base font-medium leading-tight text-metac-blue-800 underline hover:text-metac-blue-900 active:text-metac-blue-700 disabled:text-metac-blue-800 disabled:opacity-30 dark:text-metac-blue-800-dark dark:hover:text-metac-blue-900-dark dark:active:text-metac-blue-700-dark disabled:dark:text-metac-blue-800-dark"
            onClick={() => setCurrentModal({ type: "signin" })}
          >
            Log in
          </button>
        </p>
        <div className="flex flex-col text-metac-gray-900 sm:flex-row dark:text-metac-gray-900-dark">
          <form
            action={formAction}
            className="flex flex-col gap-4 border-metac-gray-300 sm:w-80 sm:border-r sm:pr-4 dark:border-metac-gray-700-dark"
          >
            <Input
              autoComplete="username"
              className="block w-full rounded border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
              placeholder="choose a username"
              type="text"
              errors={state?.errors}
              {...register("username")}
            />
            <div>
              <Input
                autoComplete="new-password"
                className="block w-full rounded-t border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
                placeholder="password"
                type="password"
                errors={state?.errors}
                {...register("password")}
              />
              <Input
                autoComplete="new-password"
                className="block w-full rounded-b border-x border-b border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
                placeholder="verify password"
                type="password"
                errors={state?.errors}
                {...register("passwordAgain")}
              />
            </div>
            <Input
              className="block w-full rounded border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
              placeholder="email"
              type="email"
              errors={state?.errors}
              {...register("email")}
            />
            <div className="text-xs text-metac-red-500 dark:text-metac-red-500-dark"></div>
            <button
              className="mt-4 inline-flex w-full items-center justify-center gap-2 rounded-full border border-metac-blue-900 bg-metac-blue-900 px-3 py-2 text-sm font-medium leading-none text-metac-gray-200 no-underline hover:border-metac-blue-800 hover:bg-metac-blue-800 active:border-metac-gray-800 active:bg-metac-gray-800 disabled:border-metac-blue-900 disabled:bg-metac-blue-900 disabled:opacity-30 dark:border-metac-blue-900-dark dark:bg-metac-blue-900-dark dark:text-metac-gray-200-dark dark:hover:border-metac-blue-800-dark dark:hover:bg-metac-blue-800-dark dark:active:border-metac-gray-800-dark dark:active:bg-metac-gray-800-dark disabled:dark:border-metac-blue-900-dark disabled:dark:bg-metac-blue-900-dark"
              type="submit"
            >
              Sign Up
            </button>
          </form>
          <div className="sm:w-80 sm:pl-4">
            <ul className="hidden leading-tight sm:block">
              <li className="mb-3 flex">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-metac-olive-700 dark:text-metac-olive-700-dark"
                />
                <span className="ml-4">
                  Keep track of your predictions and build a track record
                </span>
              </li>
              <li className="mb-3 flex">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-metac-olive-700 dark:text-metac-olive-700-dark"
                />
                <span className="ml-4">
                  Get notified when predictions that you care about change
                </span>
              </li>
              <li className="mb-3 flex">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-metac-olive-700 dark:text-metac-olive-700-dark"
                />
                <span className="ml-4">
                  Join the discussion with other forecasters
                </span>
              </li>
              <li className="mb-3 flex">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-metac-olive-700 dark:text-metac-olive-700-dark"
                />
                <span className="ml-4">
                  Create private questions to track personal predictions, and
                  optionally share them with your friends
                </span>
              </li>
              <li className="mb-3 flex">
                <FontAwesomeIcon
                  icon={faCheck}
                  className="text-metac-olive-700 dark:text-metac-olive-700-dark"
                />
                <span className="ml-4">
                  Write new public questions that you want to see answered
                </span>
              </li>
            </ul>
            <hr className="my-6 border-metac-gray-300 sm:hidden dark:border-metac-gray-300-dark" />
            <SocialButtons />
          </div>
        </div>
        <div className="mt-6 text-center text-metac-gray-700 dark:text-metac-gray-700-dark">
          By registering, you acknowledge and agree to Metaculus&apos;s{" "}
          <a target="_blank" href="/terms-of-use/">
            Terms of Use
          </a>
          <a target="_blank" href="/privacy-policy/">
            and Privacy Policy
          </a>
          .
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
  return (
    <BaseModal isOpen={isOpen} onClose={onClose}>
      <div className="max-w-sm">
        <h2 className="mb-4	mr-3 mt-0 text-2xl text-metac-blue-900 dark:text-metac-blue-900-dark">
          Activation Email Sent
        </h2>
        <div>
          <p>
            Thanks for creating a Metaculus account <b>{username}</b>!
          </p>
          <p>
            An activation email has been sent to <b>{email}</b>. Please follow
            the link inside to finish creating your account.
          </p>
        </div>
      </div>
    </BaseModal>
  );
};

export default SignUpModal;
