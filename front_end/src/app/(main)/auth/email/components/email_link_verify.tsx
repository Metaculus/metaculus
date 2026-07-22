"use client";

import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useEffect, useRef, useState } from "react";

import { verifyEmailLinkAction } from "@/app/(main)/accounts/actions";
import Button from "@/components/ui/button";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { ensureRelativeRedirect } from "@/utils/navigation";

type Props = {
  userId: string;
  token: string;
  redirectUrl: string;
};

function safeRedirect(redirectUrl: string): string {
  if (!redirectUrl) return "/";
  try {
    return ensureRelativeRedirect(redirectUrl);
  } catch {
    return "/";
  }
}

const EmailLinkVerify: FC<Props> = ({ userId, token, redirectUrl }) => {
  const t = useTranslations();
  const router = useRouter();
  const { user, setUser } = useAuth();
  const firedRef = useRef(false);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    // Consumption is JS-gated (scanner protection) and must fire exactly once.
    if (firedRef.current) return;
    firedRef.current = true;

    // Back button / refresh after a successful verify: already signed in.
    if (user) {
      router.replace(safeRedirect(redirectUrl));
      return;
    }

    if (!userId || !token) {
      setFailed(true);
      return;
    }

    void (async () => {
      const result = await verifyEmailLinkAction(userId, token);

      if ("errors" in result) {
        setFailed(true);
        return;
      }

      setUser(result.user);

      const base = safeRedirect(redirectUrl);
      router.replace(
        `${base}${base.includes("?") ? "&" : "?"}event=emailLinkConfirmed`
      );
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (failed) {
    // redirect_url is deliberately NOT honored on failure.
    return (
      <div className="flex flex-col items-center gap-4 text-center">
        <h1 className="m-0 text-blue-800 dark:text-blue-800-dark">
          {t("emailLinkInvalidTitle")}
        </h1>
        <p className="text-gray-600 dark:text-gray-600-dark">
          {t("emailLinkInvalidDescription")}
        </p>
        <Button href="/">{t("emailLinkGoHome")}</Button>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-4">
      <LoadingIndicator />
      <p className="text-gray-600 dark:text-gray-600-dark">
        {t("emailLinkSigningIn")}
      </p>
    </div>
  );
};

export default EmailLinkVerify;
