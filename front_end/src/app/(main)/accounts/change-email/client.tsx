"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, FormEvent, useState } from "react";

import loginAction from "@/app/(main)/accounts/actions";
import Button from "@/components/ui/button";
import { FormErrorMessage, Input } from "@/components/ui/form_field";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { CurrentUser } from "@/types/users";

import { confirmEmailChange } from "./actions";

export type ChangeEmailCheck =
  | { status: "valid"; newEmail: string }
  | { status: "error"; errors: ErrorResponse };

const TITLE_CLASS = "m-0 text-blue-800 dark:text-blue-800-dark";
const INPUT_CLASS =
  "block w-full rounded border border-gray-700 bg-inherit px-3 py-2 dark:border-gray-700-dark md:w-1/2";

const ErrorState: FC<{ errors: ErrorResponse }> = ({ errors }) => {
  const t = useTranslations();

  return (
    <div className="flex flex-col gap-4">
      <h1 className={TITLE_CLASS}>{t("emailChangeErrorMessage")}</h1>
      <FormErrorMessage errors={errors} className="text-sm" />
      <div>
        <Button variant="primary" href="/accounts/settings/account/">
          {t("backToSettings")}
        </Button>
      </div>
    </div>
  );
};

export const SignInForm: FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const [login, setLogin] = useState("");
  const [password, setPassword] = useState("");
  const [errors, setErrors] = useState<ErrorResponse>();

  const [signIn, isPending] = useServerAction(async () => {
    const response = await loginAction(login, password);
    if (response?.errors) {
      setErrors(response.errors);
      return;
    }
    router.refresh();
  });

  const onSubmit = (event: FormEvent) => {
    event.preventDefault();
    setErrors(undefined);
    void signIn();
  };

  return (
    <form className="flex flex-col gap-4" onSubmit={onSubmit}>
      <h1 className={TITLE_CLASS}>{t("emailChangeConfirmTitle")}</h1>
      <p className="m-0">{t("emailChangeSignInPrompt")}</p>
      <Input
        className={INPUT_CLASS}
        placeholder={t("loginUsernamePlaceholder")}
        autoComplete="username"
        value={login}
        onChange={(event) => setLogin(event.target.value)}
      />
      <Input
        className={INPUT_CLASS}
        type="password"
        placeholder={t("passwordPlaceholder")}
        autoComplete="current-password"
        value={password}
        onChange={(event) => setPassword(event.target.value)}
      />
      <FormErrorMessage errors={errors} />
      <div>
        <Button variant="primary" type="submit" disabled={isPending}>
          {t("logIn")}
        </Button>
      </div>
    </form>
  );
};

const ConfirmForm: FC<{
  token: string;
  user: CurrentUser;
  newEmail: string;
}> = ({ token, user, newEmail }) => {
  const t = useTranslations();
  const [errors, setErrors] = useState<ErrorResponse>();

  const [confirm, isPending] = useServerAction(async () => {
    const response = await confirmEmailChange(token);
    setErrors(response?.errors);
  });

  return (
    <div className="flex flex-col gap-4">
      <h1 className={TITLE_CLASS}>{t("emailChangeConfirmTitle")}</h1>
      <p className="m-0 text-sm text-gray-600 dark:text-gray-600-dark">
        {t("emailChangeConfirmSignedInAs", { username: user.username })}
      </p>
      <p className="m-0">
        {t("emailChangeConfirmDescription", {
          currentEmail: user.email,
          newEmail,
        })}
      </p>
      <FormErrorMessage errors={errors} />
      <div>
        <Button
          variant="primary"
          onClick={() => void confirm()}
          disabled={isPending}
        >
          {t("confirm")}
        </Button>
      </div>
    </div>
  );
};

type Props = {
  token: string;
  user: CurrentUser;
  check: ChangeEmailCheck;
};

const ChangeEmailClient: FC<Props> = ({ token, user, check }) => {
  if (check.status === "error") return <ErrorState errors={check.errors} />;

  return <ConfirmForm token={token} user={user} newEmail={check.newEmail} />;
};

export default ChangeEmailClient;
