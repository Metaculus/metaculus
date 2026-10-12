"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import Button from "@/components/ui/button";
import { FormErrorMessage } from "@/components/ui/form_field";
import { useModal } from "@/contexts/modal_context";
import { useServerAction } from "@/hooks/use_server_action";
import { ErrorResponse } from "@/types/fetch";
import { CurrentUser } from "@/types/users";

import { confirmEmailChange } from "./actions";

export type ChangeEmailCheck =
  | { status: "valid"; newEmail: string }
  | { status: "error"; errors: ErrorResponse };

const TITLE_CLASS = "m-0 text-blue-800 dark:text-blue-800-dark";

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

export const SignInPrompt: FC = () => {
  const t = useTranslations();
  const router = useRouter();
  const { setCurrentModal } = useModal();

  return (
    <div className="flex flex-col gap-4">
      <h1 className={TITLE_CLASS}>{t("emailChangeConfirmTitle")}</h1>
      <p className="m-0">{t("emailChangeSignInPrompt")}</p>
      <div>
        <Button
          variant="primary"
          onClick={() =>
            setCurrentModal({
              type: "signin",
              data: { onSuccess: () => router.refresh() },
            })
          }
        >
          {t("logIn")}
        </Button>
      </div>
    </div>
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
