"use client";

import Link from "next/link";
import { useTranslations } from "next-intl";
import { FC, PropsWithChildren } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

import Button from "@/components/ui/button";

const ChangeEmailErrorFallback: FC<FallbackProps> = ({ error }) => {
  const t = useTranslations();

  return (
    <>
      <h1 className="m-0">{t("emailChangeErrorMessage")}</h1>
      <p className="my-4 max-w-md text-balance text-center text-base">
        {error.message || "unknown"}
      </p>
      <Link href="/accounts/settings/account/">
        <Button variant="primary" size="md">
          {t("backToSettings")}
        </Button>
      </Link>
    </>
  );
};

const ChangeEmailLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <ErrorBoundary FallbackComponent={ChangeEmailErrorFallback}>
        {children}
      </ErrorBoundary>
    </div>
  );
};

export default ChangeEmailLayout;
