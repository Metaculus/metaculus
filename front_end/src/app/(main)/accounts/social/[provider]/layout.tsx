"use client";

import { useParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { usePostHog } from "posthog-js/react";
import { FC, PropsWithChildren, useCallback } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

import Button from "@/components/ui/button";
import useSocialAuth from "@/hooks/use_social_auth";
import { SocialProviderType } from "@/types/auth";

const SocialAuthErrorFallback: FC<FallbackProps> = ({ error }) => {
  const t = useTranslations();
  const params = useParams<{ provider: SocialProviderType }>();
  const posthog = usePostHog();
  const { socialProviders, getOAuthUrl } = useSocialAuth();

  const handleRetry = useCallback(() => {
    posthog.capture("oauth_error_retry_click", {
      provider: params.provider,
      error: error.message,
    });

    const url = getOAuthUrl(params.provider, "/");
    if (url) {
      window.location.href = url;
    }
  }, [error.message, getOAuthUrl, params.provider, posthog]);

  return (
    <>
      <h1 className="m-0">{t("oauthErrorMessage")}</h1>
      <p className="my-4 max-w-md text-balance text-center text-base">
        {error.message || "unknown"}
      </p>
      <Button
        variant="primary"
        onClick={handleRetry}
        disabled={!socialProviders}
        size="md"
      >
        {t("tryAgain")}
      </Button>
    </>
  );
};

const SocialAuthLayout: FC<PropsWithChildren> = ({ children }) => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <ErrorBoundary FallbackComponent={SocialAuthErrorFallback}>
        {children}
      </ErrorBoundary>
    </div>
  );
};

export default SocialAuthLayout;
