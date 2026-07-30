"use client";

import { useRouter } from "next/navigation";
import { FC, useEffect } from "react";
import { useErrorBoundary } from "react-error-boundary";

import { exchangeSocialOauthCode } from "@/app/(main)/accounts/social/[provider]/actions";
import {
  clearPending,
  takeSocialGatedAction,
} from "@/components/email_capture/pending_store";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { SocialProviderType } from "@/types/auth";
import { rotateCsrfToken } from "@/utils/csrf";

type Props = {
  provider: SocialProviderType;
  code: string;
  nonce: string;
  redirectUrl: string;
};

const SocialAuthClient: FC<Props> = ({
  provider,
  code,
  nonce,
  redirectUrl,
}) => {
  const router = useRouter();
  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    // A gated action stashed before the OAuth redirect rides along with the
    // code exchange; the backend applies it best-effort after sign-in.
    const stash = takeSocialGatedAction();
    exchangeSocialOauthCode(provider, code, nonce, stash?.gatedAction ?? null)
      .then(() => {
        // Invalidate the nonce now that it has served its purpose (and been
        // logged as a `state` param) — bounds any replay to the flow duration.
        rotateCsrfToken();
        // Signed in now; any pending email-confirmation reminder is obsolete
        clearPending();
        router.push(redirectUrl);
      })
      .catch(showBoundary);
  }, [provider, code, nonce, redirectUrl, router, showBoundary]);

  return (
    <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
  );
};

export default SocialAuthClient;
