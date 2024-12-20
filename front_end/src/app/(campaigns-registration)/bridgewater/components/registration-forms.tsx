"use client";

import { zodResolver } from "@hookform/resolvers/zod";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import React, { FC, useMemo, useRef, useState } from "react";
import { useForm, FormProvider, useFormContext } from "react-hook-form";
import { z } from "zod";

import {
  registerUserCampaignAction,
  signUpAction,
} from "@/app/(main)/accounts/actions";
import { signUpSchema, SignUpSchema } from "@/app/(main)/accounts/schemas";
import Button from "@/components/ui/button";
import ButtonGroup, { GroupButton } from "@/components/ui/button_group";
import Checkbox from "@/components/ui/checkbox";
import { FormError, Input } from "@/components/ui/form_field";
import { InputContainer } from "@/components/ui/input_container";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";

import { CAMPAIGN_URL_BASE_PATH } from "../constants";

export interface CampaignRegistrationProps {
  campaignKey: string;
  addToProject?: number;
}

export const tournamentRegistrationSchema = z
  .object({
    addToProject: z.number().optional(),
    fullName: z.string().min(1, "Field required"),
    country: z.string().min(1, "Field required"),
    undergrad: z.boolean(),
    institution: z.string().optional(),
    major: z.string().optional(),
    accepted_terms: z.boolean(),
  })
  .refine((data) => !data.undergrad || data.institution, {
    message: "Institution is required",
    path: ["institution"],
  })
  .refine((data) => !data.undergrad || data.major, {
    message: "Major is required",
    path: ["major"],
  });

export type TournamentRegistrationSchema = z.infer<
  typeof tournamentRegistrationSchema
>;

const AccountSignupFragment: FC<{
  errors: ErrorResponse;
}> = ({ errors }) => {
  const { register } = useFormContext();
  const t = useTranslations();
  return (
    <>
      <InputContainer labelText={"Metaculus username"}>
        <Input
          autoComplete="username"
          className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
          type="text"
          errors={errors}
          {...register("username")}
        />
      </InputContainer>
      <div>
        <InputContainer labelText={"Password"}>
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
        </InputContainer>
        <FormError errors={errors} name={"password"} />
      </div>
      <InputContainer labelText={"Email"}>
        <Input
          className="block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
          type="email"
          errors={errors}
          {...register("email")}
        />
      </InputContainer>
      <input type="hidden" {...register("isBot")} />
    </>
  );
};

const ExtraDataRegistrationFragment: FC<{ errors: ErrorResponse }> = ({
  errors,
}) => {
  const { register, setValue, watch } = useFormContext();
  const t = useTranslations();

  const undergradGroupButtonOptions: GroupButton<string>[] = useMemo(
    () => [
      {
        value: "yes",
        label: t("yes").toUpperCase(),
      },
      {
        value: "no",
        label: t("no").toUpperCase(),
      },
    ],
    [t]
  );

  return (
    <>
      <InputContainer labelText={t("fullName")}>
        <Input
          autoComplete="full-name"
          className="block w-full rounded-b-none rounded-t border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
          type="text"
          errors={errors}
          {...register("fullName")}
        />
      </InputContainer>

      <InputContainer labelText={t("country")}>
        <Input
          autoComplete="Country"
          className="block w-full rounded-b-none rounded-t border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
          type="text"
          errors={errors}
          {...register("country")}
        />
      </InputContainer>

      <div className="flex w-full flex-col items-center">
        <p className="text-xs text-gray-900 dark:text-gray-900-dark">
          {t("undergraduateStudentQuestion")}
        </p>

        <ButtonGroup
          value={watch("undergrad") ? "yes" : "no"}
          buttons={undergradGroupButtonOptions}
          onChange={(value) => setValue("undergrad", value === "yes")}
        />
      </div>

      {watch("undergrad") && (
        <>
          <InputContainer labelText={t("institution")}>
            <Input
              autoComplete="Institution"
              className="block w-full rounded-b-none rounded-t border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              type="text"
              errors={errors}
              {...register("institution")}
            />
          </InputContainer>

          <InputContainer labelText={t("major")}>
            <Input
              autoComplete="Major"
              className="block w-full rounded-b-none rounded-t border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark"
              type="text"
              errors={errors}
              {...register("major")}
            />
          </InputContainer>
        </>
      )}
    </>
  );
};

export const RegistrationAndSignupForm: FC<
  {
    onSuccess: (email: string) => void;
  } & CampaignRegistrationProps
> = ({ onSuccess, campaignKey, addToProject }) => {
  const t = useTranslations();
  const [isTurnstileValidated, setIsTurnstileValidate] = useState(false);
  const turnstileRef = useRef<TurnstileInstance | undefined>();
  const methods = useForm<SignUpSchema & TournamentRegistrationSchema>({
    resolver: zodResolver(
      z.intersection(signUpSchema, tournamentRegistrationSchema)
    ),
    defaultValues: {
      isBot: false,
      undergrad: false,
      addToProject,
      campaignKey,
    },
  });

  const { watch, setValue, formState, handleSubmit, setError, clearErrors } =
    methods;

  const currentLocation = usePathname();

  const onSubmit = async (data: SignUpSchema) => {
    const response = await signUpAction({
      ...data,
      campaignKey,
      campaignData: {
        full_name: watch("fullName"),
        country: watch("country"),
        undegrad: watch("undergrad"),
        institution: watch("undergrad") ? watch("institution") : undefined,
        major: watch("undergrad") ? watch("major") : undefined,
        accepted_terms: watch("accepted_terms"),
      },
      redirectUrl: currentLocation,
    });

    if (response && response.errors) {
      for (const error in response.errors) {
        if (error === "message") {
          setError("non_field_errors" as keyof TournamentRegistrationSchema, {
            type: "custom",
            message: response.errors[error],
          });
        } else {
          setError(error as keyof TournamentRegistrationSchema, {
            type: "custom",
            message: response.errors[error][0],
          });
        }
      }
    } else {
      onSuccess(watch("email"));
    }

    if (Object.keys(formState.errors).length > 0) {
      turnstileRef.current?.reset();
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
      <form
        onSubmit={handleSubmit(submit)}
        className="flex flex-col gap-4 bg-gray-0 p-8 dark:bg-gray-0-dark"
      >
        <div className="flex flex-col gap-8 sm:flex-row">
          <div className="flex flex-1 flex-col gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-600">
              These are for your new Metaculus account
            </p>
            <AccountSignupFragment errors={errors} />
          </div>
          <div className="hidden w-[1px] border-l border-blue-400 dark:border-blue-400-dark sm:block"></div>

          <div className="flex flex-1 flex-col gap-4">
            <p className="text-sm text-gray-600 dark:text-gray-600">
              These are to register for the tournament
            </p>
            <ExtraDataRegistrationFragment errors={errors} />
          </div>
        </div>

        <div className="mt-7 flex flex-col items-center gap-7">
          <FormError
            errors={errors}
            name={
              process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY ? "" : "turnstileToken"
            }
          />
          {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
            <Turnstile
              ref={turnstileRef}
              siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
              onSuccess={(token) => {
                setIsTurnstileValidate(true);
                setValue("turnstileToken", token);
                clearErrors("turnstileToken");
              }}
              onError={() => setIsTurnstileValidate(false)}
              onExpire={() => setIsTurnstileValidate(false)}
            />
          )}

          <FormError
            errors={errors}
            name="non_field_errors"
            className="text-red-500-dark"
          />

          <Checkbox
            className="flex gap-1 text-xs text-gray-900 dark:text-gray-900-dark"
            errors={errors}
            onChange={(checked) => setValue("accepted_terms", checked)}
            label="accepted_terms"
          >
            <span>
              I have read and agree to the{" "}
              <a
                href="/bridgewater/notice-at-collection/"
                onClick={(e) => e.stopPropagation()}
                target="_blank"
              >
                Notice at Collection
              </a>
              {" and the "}
              <a
                href="/bridgewater/contest-rules/"
                onClick={(e) => e.stopPropagation()}
                target="_blank"
              >
                Official Competition Rules
              </a>
              {", "}
              agree to share my information with Bridgewater Associates, and I
              agree to be contacted by the Bridgewater recruitment team.
            </span>
          </Checkbox>

          <Button
            variant="primary"
            className=""
            type="submit"
            disabled={
              isPending || !isTurnstileValidated || !watch("accepted_terms")
            }
          >
            {t("finishRegistration")}
          </Button>

          <div className="text-center text-xs text-gray-900 dark:text-gray-900-dark">
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
      </form>
    </FormProvider>
  );
};

export const RegistrationForm: FC<
  {
    onSuccess: () => void;
  } & CampaignRegistrationProps
> = ({ onSuccess, campaignKey, addToProject }) => {
  const t = useTranslations();
  const methods = useForm<TournamentRegistrationSchema>({
    resolver: zodResolver(tournamentRegistrationSchema),
    defaultValues: {
      undergrad: false,
      accepted_terms: false,
    },
  });

  const { watch, formState, handleSubmit, setError, setValue } = methods;

  const onSubmit = async () => {
    const response = await registerUserCampaignAction(
      campaignKey,
      {
        full_name: watch("fullName"),
        country: watch("country"),
        undegrad: watch("undergrad"),
        institution: watch("undergrad") ? watch("institution") : undefined,
        major: watch("undergrad") ? watch("major") : undefined,
        accepted_terms: watch("accepted_terms"),
      },
      addToProject
    );

    if (response && response.errors) {
      for (const error in response.errors) {
        if (error === "message") {
          setError("non_field_errors" as keyof TournamentRegistrationSchema, {
            type: "custom",
            message: response.errors[error],
          });
        } else {
          setError(error as keyof TournamentRegistrationSchema, {
            type: "custom",
            message: response.errors[error][0],
          });
        }
      }
    } else {
      onSuccess();
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
      <form
        onSubmit={handleSubmit(submit)}
        className="flex flex-col gap-4 bg-gray-0 px-[68px] py-8 dark:bg-gray-0-dark"
      >
        <div className="flex flex-col gap-4">
          <ExtraDataRegistrationFragment errors={errors} />
        </div>

        <FormError
          errors={errors}
          name="non_field_errors"
          className="text-red-500-dark"
        />

        <Checkbox
          className="flex gap-1 text-xs text-gray-900 dark:text-gray-900-dark"
          errors={errors}
          onChange={(checked) => setValue("accepted_terms", checked)}
          label="accepted_terms"
        >
          <span>
            I have read and agree to the{" "}
            <a
              href="/bridgewater/notice-at-collection/"
              onClick={(e) => e.stopPropagation()}
              target="_blank"
            >
              Notice at Collection
            </a>
            {" and the "}
            <a
              href="/bridgewater/contest-rules/"
              onClick={(e) => e.stopPropagation()}
              target="_blank"
            >
              Official Competition Rules
            </a>
            {", "}
            agree to share my information with Bridgewater Associates, and I
            agree to be contacted by the Bridgewater recruitment team.
          </span>
        </Checkbox>

        <div className="mt-7 flex flex-col items-center gap-7">
          <Button
            variant="primary"
            className=""
            type="submit"
            disabled={isPending || !watch("accepted_terms")}
          >
            {t("finishRegistration")}
          </Button>
        </div>
      </form>
    </FormProvider>
  );
};

export const RegistrationPage: FC<CampaignRegistrationProps> = ({
  campaignKey,
  addToProject,
}) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const router = useRouter();

  if (!user) {
    return (
      <div>
        <p className="text-center text-sm text-gray-800 dark:text-gray-800-dark">
          First you need to{" "}
          <Button
            variant="link"
            className="flex-inline"
            onClick={() => setCurrentModal({ type: "signin" })}
          >
            Log in
          </Button>
        </p>{" "}
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center">
      <p className="text-xs text-gray-600 dark:text-gray-600-dark">
        Logged in as <span className="font-extrabold">{user.username}</span>
      </p>
      <div className="mt-1 w-full max-w-[640px] px-8">
        <RegistrationForm
          onSuccess={() => router.refresh()}
          campaignKey={campaignKey}
          addToProject={addToProject}
        />
      </div>
    </div>
  );
};

export const RegistrationAndSignUpPage: FC<CampaignRegistrationProps> = ({
  campaignKey,
  addToProject,
}) => {
  const router = useRouter();
  return (
    <div className="flex flex-col items-center">
      <div className="mt-1">
        <RegistrationAndSignupForm
          onSuccess={(email) =>
            router.push(
              `${CAMPAIGN_URL_BASE_PATH}/success/?email=${encodeURIComponent(email)}`
            )
          }
          campaignKey={campaignKey}
          addToProject={addToProject}
        />
      </div>
    </div>
  );
};
