"use client";

import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, startTransition, useEffect, useRef, useState } from "react";

import {
  requestEmailLinkAction,
  verifyEmailLinkAction,
} from "@/app/(main)/accounts/actions";
import { updateProfileAction } from "@/app/(main)/accounts/profile/actions";
import SigningInPanel from "@/components/auth/signing_in_panel";
import { readPending } from "@/components/email_capture/pending_store";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import { useAuth } from "@/contexts/auth_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useServerAction } from "@/hooks/use_server_action";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";
import { withConfirmedEvent } from "@/utils/email_link_confirmation";
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
  const { PUBLIC_TURNSTILE_SITE_KEY } = usePublicSettings();
  const firedRef = useRef(false);
  const [failed, setFailed] = useState(false);

  // Recovery form state: a dead link should never be a dead end. The device's
  // pending record (when present) supplies the address and the deferred action
  // so the fresh link carries the same intent.
  const [draft, setDraft] = useState("");
  const [requestSent, setRequestSent] = useState(false);
  const [sentWithAction, setSentWithAction] = useState(false);
  const [requestError, setRequestError] = useState<"format" | "server" | null>(
    null
  );
  const [isTurnstileValidated, setIsTurnstileValidated] = useState(
    !PUBLIC_TURNSTILE_SITE_KEY
  );
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const turnstileTokenRef = useRef<string | undefined>(undefined);

  // Warm the destination first, then navigate inside a transition: React keeps
  // this panel on screen until the next route has fully rendered, so nothing
  // paints half-finished. The curtain on the other side fades it away.
  const goTo = (destination: string) => {
    router.prefetch(destination);
    startTransition(() => {
      router.replace(destination);
    });
  };

  useEffect(() => {
    // Consumption is JS-gated (scanner protection) and must fire exactly once.
    if (firedRef.current) return;
    firedRef.current = true;

    // Back button / refresh after a successful verify: already signed in.
    if (user) {
      goTo(safeRedirect(redirectUrl));
      return;
    }

    if (!userId || !token) {
      setFailed(true);
      setDraft(readPending()?.email ?? "");
      return;
    }

    void (async () => {
      const result = await verifyEmailLinkAction(userId, token);

      if ("errors" in result) {
        setFailed(true);
        setDraft(readPending()?.email ?? "");
        return;
      }

      // Read before setUser: the confirm-email banner clears the pending
      // record in an effect as soon as a user appears, so the destination
      // page can no longer discover which action the link carried
      const pending = readPending();
      const appliedTrigger = pending?.trigger ?? null;

      // Closes the funnel emailSubmitted opens. Without it the last thing
      // measured is someone typing an address, not their coming back through
      // the link, so the drop-off between the two is invisible. A link opened
      // on a different device has no local record, which is what sameDevice
      // reports - those arrivals carry no trigger or surface.
      sendAnalyticsEvent("emailLinkVerified", {
        trigger: appliedTrigger,
        surface: pending?.surface,
        sameDevice: !!pending,
      });

      // Arriving by magic link means exploring, not enrolling: skip the
      // forecaster tutorial for good rather than interrupting the action the
      // user actually came to complete. Persisted so it holds on every device.
      // Awaited and revalidating, not fire-and-forget: the destination page is
      // server-rendered during the redirect below, and staleTimes.dynamic
      // would otherwise serve a cached payload carrying the old flag, opening
      // the tutorial anyway. Never let this block signing in.
      const skipsOnboarding = !result.user.is_onboarding_complete;
      if (skipsOnboarding) {
        try {
          await updateProfileAction({ is_onboarding_complete: true });
        } catch {
          // Non-fatal: worst case the tutorial appears once
        }
      }

      setUser(
        skipsOnboarding
          ? { ...result.user, is_onboarding_complete: true }
          : result.user
      );

      goTo(withConfirmedEvent(safeRedirect(redirectUrl), appliedTrigger));
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const requestNewLink = async () => {
    const email = draft.trim();
    setRequestError(null);
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      setRequestError("format");
      return;
    }
    const pending = readPending();
    const response = await requestEmailLinkAction({
      email,
      redirectUrl: pending?.redirectUrl ?? null,
      gatedAction: pending?.gatedAction ?? null,
      turnstileToken: turnstileTokenRef.current,
    });
    // Turnstile tokens are single-use: drop the spent one and wait for the
    // widget to hand us a fresh one before the button re-enables
    turnstileRef.current?.reset();
    turnstileTokenRef.current = undefined;
    setIsTurnstileValidated(!PUBLIC_TURNSTILE_SITE_KEY);
    if (response.errors) {
      setRequestError("server");
      return;
    }
    setSentWithAction(!!pending?.gatedAction);
    setRequestSent(true);
  };
  const [submitRequest, isRequesting] = useServerAction(requestNewLink);

  if (failed) {
    // redirect_url is deliberately NOT honored on failure.
    return (
      <div className="flex min-h-screen flex-col items-center justify-center gap-4 px-4 text-center">
        <h1 className="m-0 text-blue-800 dark:text-blue-800-dark">
          {t("emailLinkInvalidTitle")}
        </h1>
        <p className="m-0 text-gray-600 dark:text-gray-600-dark">
          {t("emailLinkInvalidDescription")}
        </p>
        {requestSent ? (
          <div className="flex max-w-xs items-center gap-2 rounded border border-mint-500 bg-mint-200 px-4 py-3 text-left text-sm font-semibold text-mint-800 dark:border-mint-500-dark dark:bg-mint-200-dark dark:text-mint-800-dark">
            {sentWithAction
              ? t("emailLinkNewSentWithAction", { email: draft.trim() })
              : t("emailLinkNewSent", { email: draft.trim() })}
          </div>
        ) : (
          <div className="flex w-full max-w-xs flex-col gap-2.5 pt-1">
            <Input
              type="email"
              inputMode="email"
              autoComplete="email"
              aria-label={t("emailCaptureEmailLabel")}
              placeholder="you@example.com"
              value={draft}
              onChange={(e) => {
                setDraft(e.target.value);
                if (requestError === "format") setRequestError(null);
              }}
              // Not inside a <form>, so Enter needs wiring
              onKeyDown={(e) => {
                if (
                  e.key === "Enter" &&
                  !isRequesting &&
                  isTurnstileValidated
                ) {
                  e.preventDefault();
                  void submitRequest();
                }
              }}
              className={cn(
                "h-12 w-full rounded border-[1.5px] bg-gray-0 px-3.5 text-center text-base text-gray-900 dark:bg-gray-0-dark dark:text-gray-900-dark",
                requestError
                  ? "border-salmon-500 dark:border-salmon-500-dark"
                  : "border-gray-400 dark:border-gray-400-dark"
              )}
            />
            {requestError && (
              <span className="text-sm text-salmon-800 dark:text-salmon-800-dark">
                {requestError === "format"
                  ? t("emailCaptureFormatError")
                  : t("emailCaptureServerError")}
              </span>
            )}
            <Button
              variant="primary"
              disabled={isRequesting || !isTurnstileValidated}
              onClick={submitRequest}
            >
              {t("emailLinkRequestNew")}
            </Button>
            {PUBLIC_TURNSTILE_SITE_KEY && (
              <Turnstile
                ref={turnstileRef}
                siteKey={PUBLIC_TURNSTILE_SITE_KEY}
                options={{ appearance: "interaction-only" }}
                className="self-center"
                onSuccess={(turnstileToken) => {
                  turnstileTokenRef.current = turnstileToken;
                  setIsTurnstileValidated(true);
                }}
                onError={() => setIsTurnstileValidated(false)}
                onExpire={() => setIsTurnstileValidated(false)}
              />
            )}
          </div>
        )}
        <Button variant="text" href="/">
          {t("emailLinkGoHome")}
        </Button>
      </div>
    );
  }

  return <SigningInPanel message={t("emailLinkSigningIn")} />;
};

export default EmailLinkVerify;
