"use client"

import Button from "@/components/ui/button";
import ButtonGroup from "@/components/ui/button_group";
import { useEffect, useState } from "react";
import { SubmitHandler, useForm } from "react-hook-form";
import { useTranslations } from "next-intl";

// import { http } from "../../http";
// import { modals } from "../../modalData";
// import Button from "../Button";

const MIN_USER_LEN = 1;
const MAX_USER_LEN = 200;
const MIN_PASS_LEN = 6;
const MAX_PASS_LEN = 200;
const MIN_EMAIL_LEN = 3;
const MAX_EMAIL_LEN = 200;

interface IFormInput {
  username: string;
  password: string;
  passwordAgain: string;
  email: string;
  is_bot: boolean;
}

function BotRegistration() {
  const t = useTranslations();
  const {
    formState: { errors, isSubmitting },
    handleSubmit,
    register,
    setError,
    watch,
  } = useForm<IFormInput>({ defaultValues: { is_bot: true } });

  const [, setParams] = useState(new URLSearchParams());
  /* eslint-disable react-hooks/exhaustive-deps */
  useEffect(() => {
    setParams(new URLSearchParams(window.location.search));
  }, [window.location.search]);
  /* eslint-enable react-hooks/exhaustive-deps */

  const onSubmit: SubmitHandler<IFormInput> = async (data) => {
    const encodedCurrentURL = encodeURIComponent(window.location.href);
    try {
      const response = await http.post(
        `/api2/accounts/register/?next=${encodedCurrentURL}`,
        data,
      );

      if (response.ok) {
        window.gtag("event", "register", {
          event_category: "sign-up", // for backward compatibility
          event_action: "click",
          event_label: "email",
        });
        return modals.setActive("sign-up-success", data);
      }

      Object.entries(await response.json()).map(([key, errors]) =>
        setError(key as keyof IFormInput, {
          type: "server",
          message: (errors as string[])[0],
        }),
      );
    } catch (error) {
      console.error(error);
    }
  };

  return (
    <>
      <div className="px-4">
        <h1 className="mx-auto mt-2 text-center text-metac-blue-800 dark:text-metac-blue-800-dark">
          Create a Bot Account
        </h1>
        <p className="mx-auto text-center leading-normal opacity-75">
          If you already created a bot account before, close this modal and log
          in as you would to a regular Metaculus account.
        </p>
        <div className="mx-auto flex flex-col text-metac-gray-900 dark:text-metac-gray-900-dark sm:flex-row">
          <form
            className="mx-auto mt-4 flex w-full flex-col gap-4 border-metac-gray-300 dark:border-metac-gray-700-dark sm:w-80 sm:pr-4"
            onSubmit={handleSubmit(onSubmit)}
          >
            <input
              autoComplete="username"
              className="block w-full rounded border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
              placeholder={t("registrationUsernamePlaceholder")}
              type="text"
              {...register("username", {
                required: t("errorRequired"),
                minLength: {
                  value: MIN_USER_LEN,
                  message: t("errorMinLength", {
                    field: "username",
                    minLength: MIN_USER_LEN,
                  }),
                },
                maxLength: {
                  value: MAX_USER_LEN,
                  message: t("errorMaxLength", {
                    field: "username",
                    maxLength: MAX_USER_LEN,
                  }),
                },
              })}
            />
            {errors.username && (
              <div className="text-xs text-metac-red-500 dark:text-metac-red-500-dark">
                {errors.username.message}
              </div>
            )}
            <div>
              <input
                autoComplete="new-password"
                className="block w-full rounded-t border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
                placeholder={t("passwordPlaceholder")}
                type="password"
                {...register("password", {
                  required: t("errorRequired"),
                  minLength: {
                    value: MIN_PASS_LEN,
                    message: t("errorMinLength", {
                      field: "password",
                      minLength: MIN_PASS_LEN,
                    }),
                  },
                  maxLength: {
                    value: MAX_PASS_LEN,
                    message: t("errorMaxLength", {
                      field: "password",
                      maxLength: MAX_PASS_LEN,
                    }),
                  },
                })}
              />
              <input
                autoComplete="new-password"
                className="block w-full rounded-b border-x border-b border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
                placeholder={t("registrationVerifyPasswordPlaceholder")}
                type="password"
                {...register("passwordAgain", {
                  validate: (value) =>
                    value === watch("password") || t("errorPasswordMatch"),
                })}
              />
            </div>
            {errors.password && (
              <div className="text-xs text-metac-red-500 dark:text-metac-red-500-dark">
                {errors.password.message}
              </div>
            )}
            {errors.passwordAgain && (
              <div className="text-xs text-metac-red-500 dark:text-metac-red-500-dark">
                {errors.passwordAgain.message}
              </div>
            )}
            <input
              className="block w-full rounded border border-metac-gray-700 bg-inherit px-3 py-2 dark:border-metac-gray-700-dark"
              placeholder={t("registrationEmailPlaceholder")}
              type="email"
              {...register("email", {
                required: t("errorRequired"),
                minLength: {
                  value: MIN_EMAIL_LEN,
                  message: t("errorMinLength", {
                    field: "email",
                    minLength: MIN_EMAIL_LEN,
                  }),
                },
                maxLength: {
                  value: MAX_EMAIL_LEN,
                  message: t("errorMaxLength", {
                    field: "email",
                    maxLength: MAX_EMAIL_LEN,
                  }),
                },
              })}
            />
            {errors.email && (
              <div className="text-xs text-metac-red-500 dark:text-metac-red-500-dark">
                {errors.email.message}
              </div>
            )}

            <Button
              variant="primary"
              className="w-full"
              disabled={isSubmitting}
              type="submit"
            >
              {t("registrationByEmail")}
            </Button>
          </form>
        </div>

        <div className="mt-6 text-balance px-4 text-center leading-normal text-metac-gray-700 opacity-75 dark:text-metac-gray-700-dark">

{/*           
          <Trans
            i18nKey="registrationTerms"
            components={{
              terms: <a target="_blank" href="/terms-of-use/" />,
              privacy: <a target="_blank" href="/privacy-policy/" />,
            }}
          /> */}
        </div>
      </div>
    </>
  );
}

export default BotRegistration;
