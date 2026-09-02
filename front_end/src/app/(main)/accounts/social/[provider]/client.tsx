"use client";

import { useRouter } from "next/navigation";
import { FC, useEffect } from "react";
import { useErrorBoundary } from "react-error-boundary";

import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import { exchangeSocialOauthCode } from "@/app/(main)/accounts/social/[provider]/actions";
import {
  clearPending,
  takeSocialGatedAction,
} from "@/components/email_capture/pending_store";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { SocialProviderType } from "@/types/auth";
import { rotateCsrfToken } from "@/utils/csrf";
import { withConfirmedEvent } from "@/utils/email_link_confirmation";

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
    void (async () => {
      try {
        await exchangeSocialOauthCode(
          provider,
          code,
          nonce,
          stash?.gatedAction ?? null,
          // A stash means the capture drawer sent them here, which is what
          // decides whether a brand-new account starts in the consumer view
          !!stash
        );
        // Invalidate the nonce now that it has served its purpose (and been
        // logged as a `state` param) — bounds any replay to the flow duration.
        rotateCsrfToken();
        // Signed in now; any pending email-confirmation reminder is obsolete
        clearPending();

        // Coming through the capture drawer means exploring, not enrolling, so
        // skip the forecaster tutorial the same way the email-link path does.
        // Awaited and revalidating, not fire-and-forget: the destination page is
        // server-rendered during the push below, and staleTimes.dynamic would
        // otherwise hand it a cached payload carrying the old flag.
        if (stash) {
          try {
            await updateProfileAction({ is_onboarding_complete: true });
          } catch {
            // Non-fatal: worst case the tutorial appears once
          }
        }

        // Same confirmation the email-link path shows, so a carried-through
        // action is acknowledged rather than applied silently
        router.push(
          withConfirmedEvent(
            redirectUrl,
            stash?.gatedAction ? stash.trigger : null
          )
        );
      } catch (error) {
        showBoundary(error);
      }
    })();
  }, [provider, code, nonce, redirectUrl, router, showBoundary]);

  return (
    <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
  );
};

export default SocialAuthClient;
