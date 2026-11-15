"use client";

import { useTranslations } from "next-intl";
import { FC, useActionState } from "react";

import Button from "@/components/ui/button";
import { FormError, FormErrorMessage, Input } from "@/components/ui/form_field";
import LoadingSpinner from "@/components/ui/loading_spiner";
import { ErrorResponse } from "@/types/fetch";

import { emailRollbackAction, EmailRollbackActionState } from "./actions";

export type EmailRollbackCheck =
  | { status: "valid"; oldEmail: string }
  | { status: "error"; errors: ErrorResponse };

const INPUT_CLASS =
  "block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark";

type Props = {
  token: string;
  check: EmailRollbackCheck;
};

const EmailRollbackClient: FC<Props> = ({ token, check }) => {
  const t = useTranslations();
  const [state, formAction, isPending] = useActionState<
    EmailRollbackActionState,
    FormData
  >(emailRollbackAction, null);

  if (check.status === "error") {
    return (
      <div className="flex flex-col gap-4">
        <h1 className="m-0 text-blue-800 dark:text-blue-800-dark">
          {t("emailRollbackErrorTitle")}
        </h1>
        <FormErrorMessage errors={check.errors} className="text-sm" />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <h1 className="m-0 text-blue-800 dark:text-blue-800-dark">
        {t("emailRollbackTitle")}
      </h1>
      <p className="m-0">
        {t("emailRollbackDescription", { email: check.oldEmail })}
      </p>
      <p className="m-0 text-sm text-gray-600 dark:text-gray-600-dark">
        {t("emailRollbackConsequences")}
      </p>
      <form className="mt-3 flex flex-col gap-4 md:w-1/2" action={formAction}>
        <input type="hidden" name="token" value={token} />
        <div>
          <Input
            className={INPUT_CLASS}
            type="password"
            name="password"
            autoComplete="new-password"
            placeholder={t("newPasswordPlaceholder")}
          />
          <FormError errors={state?.errors} name="password" />
        </div>
        <div>
          <Input
            className={INPUT_CLASS}
            type="password"
            name="passwordAgain"
            autoComplete="new-password"
            placeholder={t("verifyPasswordPlaceholder")}
          />
          <FormError errors={state?.errors} name="passwordAgain" />
          <FormError
            errors={state?.errors}
            name="non_field_errors"
            className="text-red-500-dark"
          />
        </div>
        <div className="flex items-center">
          <Button variant="primary" type="submit" disabled={isPending}>
            {t("emailRollbackButton")}
          </Button>
          {isPending && <LoadingSpinner className="ml-2" size="1x" />}
        </div>
      </form>
    </div>
  );
};

export default EmailRollbackClient;
