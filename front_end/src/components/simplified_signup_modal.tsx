"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, useEffect, useMemo, useState } from "react";
import { useForm } from "react-hook-form";
import * as z from "zod";

import { simplifiedSignUpAction } from "@/app/(main)/accounts/actions";
import BaseModal from "@/components/base_modal";
import Button from "@/components/ui/button";
import { FormError, Input } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { ErrorResponse } from "@/types/fetch";

const simplifiedSignupSchema = z.object({
  username: z.string().min(1, { message: "Username is required" }),
});
type SimplifiedSignupSchema = z.infer<typeof simplifiedSignupSchema>;

const SimplifiedSignupModal: FC = () => {
  const { user, setUser } = useAuth();
  const { setCurrentModal } = useModal();
  const t = useTranslations();
  const searchParams = useSearchParams();
  const signupToken = useMemo(
    () => searchParams?.get("signup_token") || "",
    [searchParams]
  );
  const [isOpen, setIsOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [submitErrors, setSubmitErrors] = useState<ErrorResponse>([]);

  const { register, handleSubmit, formState, clearErrors } =
    useForm<SimplifiedSignupSchema>({
      mode: "all",
      resolver: zodResolver(simplifiedSignupSchema),
    });

  useEffect(() => {
    setIsOpen(!user && !!signupToken);
  }, [user, signupToken]);

  const onSubmit = async (values: SimplifiedSignupSchema) => {
    if (!signupToken) return;

    setIsLoading(true);
    setSubmitErrors([]);
    clearErrors();

    try {
      const response = await simplifiedSignUpAction(
        values.username,
        signupToken
      );

      if (response && "errors" in response && !!response.errors) {
        setSubmitErrors(response.errors);
      }

      if (response && "user" in response) {
        setUser(response.user);
        setIsOpen(false);
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <BaseModal
      isOpen={isOpen}
      onClose={() => {}}
      isImmersive={true}
      label={t("chooseYourUsername")}
      className="md:max-w-sm"
    >
      <form onSubmit={handleSubmit(onSubmit)} className="flex flex-col gap-4">
        <div className="w-full">
          <Input
            placeholder="Username"
            autoComplete="username"
            errors={formState.errors.username}
            {...register("username")}
            className="w-full rounded border border-gray-500 px-3 py-2 text-base dark:border-gray-500-dark dark:bg-blue-50-dark"
          />
          <FormError errors={submitErrors} />
        </div>
        <div>
          <Button
            type="submit"
            variant="primary"
            className="w-full"
            disabled={isLoading}
          >
            Continue
          </Button>
        </div>
        <div className="mb-2 text-center text-sm leading-tight text-gray-700 dark:text-gray-700-dark">
          {t("registrationSignInHeading")}&nbsp;
          <Button
            variant="link"
            size="sm"
            onClick={() => setCurrentModal({ type: "signin" })}
          >
            {t("logIn")}
          </Button>
        </div>
        <hr className="m-0 border-gray-300 dark:border-gray-300-dark" />
        <div className="mt-2 text-center text-gray-700 dark:text-gray-700-dark">
          {t.rich("continueTerms", {
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
      </form>
    </BaseModal>
  );
};

export default SimplifiedSignupModal;
