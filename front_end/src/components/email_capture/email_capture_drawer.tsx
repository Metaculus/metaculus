"use client";

import { faArrowLeft, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { Turnstile, TurnstileInstance } from "@marsidev/react-turnstile";
import Link from "next/link";
import { usePathname, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import { FC, useEffect, useMemo, useRef, useState } from "react";
import toast from "react-hot-toast";

import { requestEmailLinkAction } from "@/app/(main)/accounts/actions";
import BaseModal from "@/components/base_modal";
import { Google } from "@/components/icons/google";
import {
  getDefaultSubscriptionProps,
  getInitialNotebookSubscriptions,
} from "@/components/post_subscribe/subscribe_button/utils";
import BottomDrawer from "@/components/ui/bottom_drawer";
import Button from "@/components/ui/button";
import { Input } from "@/components/ui/form_field";
import {
  registerSubscribeCaptureExposure,
  useSubscribeCaptureVariant,
} from "@/contexts/experiments_context";
import { useModal } from "@/contexts/modal_context";
import { usePublicSettings } from "@/contexts/public_settings_context";
import { useBreakpoint } from "@/hooks/tailwind";
import { useServerAction } from "@/hooks/use_server_action";
import useSocialAuth from "@/hooks/use_social_auth";
import { CaptureTrigger, GatedActionInput } from "@/types/gated_actions";
import { PostSubscription, PostSubscriptionType } from "@/types/post";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";

import {
  clearPending,
  readPending,
  stashSocialGatedAction,
  writePending,
} from "./pending_store";

const RESEND_COOLDOWN_S = 30;

type EmailCaptureView = "options" | "input" | "sent";

type SubscribeOptionId = "resolve" | "forecast" | "discussion";

type Props = {
  isOpen: boolean;
  onClose: () => void;
  trigger: CaptureTrigger;
  surface?: string;
  gatedAction?: GatedActionInput | null;
  subscribePost?: { postId: number; isNotebook: boolean };
  initialView?: EmailCaptureView;
};

const OPTION_DEFS = [
  { id: "resolve", labelKey: "emailCaptureOptionResolve" },
  { id: "forecast", labelKey: "emailCaptureOptionForecast" },
  { id: "discussion", labelKey: "emailCaptureOptionDiscussion" },
] as const satisfies readonly { id: SubscribeOptionId; labelKey: string }[];

const EmailCaptureDrawer: FC<Props> = ({
  isOpen,
  onClose,
  trigger,
  surface,
  gatedAction,
  subscribePost,
  initialView,
}) => {
  const t = useTranslations();
  const { setCurrentModal } = useModal();
  const { PUBLIC_TURNSTILE_SITE_KEY } = usePublicSettings();
  const { socialProviders, getOAuthUrl } = useSocialAuth();
  const isDesktop = useBreakpoint("sm");
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const captureVariant = useSubscribeCaptureVariant();
  const openedAsRecap = initialView === "sent";
  // Experiment test arm skips the options step: straight to email, and the
  // default selection (resolution only) becomes the subscription payload
  const hasOptionsStep =
    trigger === "post_subscribe" &&
    !subscribePost?.isNotebook &&
    !openedAsRecap &&
    captureVariant !== "test";

  const [view, setView] = useState<EmailCaptureView>(
    initialView ?? (hasOptionsStep ? "options" : "input")
  );
  const [selection, setSelection] = useState<
    Record<SubscribeOptionId, boolean>
  >({ resolve: true, forecast: false, discussion: false });
  const [draft, setDraft] = useState("");
  const [editingEmail, setEditingEmail] = useState(false);
  const [error, setError] = useState<"format" | "server" | null>(null);
  const [sentEmail, setSentEmail] = useState<string | null>(null);
  const [wasRepeatSend, setWasRepeatSend] = useState(false);
  const [lastSendAt, setLastSendAt] = useState<number | null>(null);
  const [resendFeedback, setResendFeedback] = useState(false);
  const [cooldownLeft, setCooldownLeft] = useState(0);

  const [isTurnstileValidated, setIsTurnstileValidated] = useState(
    !PUBLIC_TURNSTILE_SITE_KEY
  );
  const turnstileRef = useRef<TurnstileInstance | null>(null);
  const turnstileTokenRef = useRef<string | undefined>(undefined);
  const sentThisSessionRef = useRef(false);

  // The pending record backs the repeat/recap states. Read once per open;
  // live updates while the sheet is open are our own writes.
  const pending = useMemo(() => (isOpen ? readPending() : null), [isOpen]);
  const prefilled = !openedAsRecap && !!pending && !editingEmail;

  const redirectUrl = useMemo(() => {
    const query = searchParams.toString();
    return query ? `${pathname}?${query}` : pathname;
  }, [pathname, searchParams]);

  const googleUrl = socialProviders?.some((p) => p.name === "google-oauth2")
    ? getOAuthUrl("google-oauth2", pathname)
    : null;

  useEffect(() => {
    if (!isOpen) return;
    sentThisSessionRef.current = false;
    sendAnalyticsEvent("emailCaptureShown", {
      trigger,
      surface,
      captureVariant: captureVariant ?? "none",
    });
    if (trigger === "post_subscribe" && captureVariant) {
      registerSubscribeCaptureExposure();
    }
    if (hasOptionsStep) {
      sendAnalyticsEvent("subscribeOptionsShown", { trigger, surface });
    }
    if (openedAsRecap) {
      const record = readPending();
      setSentEmail(record?.email ?? null);
      setLastSendAt(record?.sentAt ?? null);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  useEffect(() => {
    if (!lastSendAt) return;
    const tick = () => {
      const left = Math.ceil(
        RESEND_COOLDOWN_S - (Date.now() - lastSendAt) / 1000
      );
      setCooldownLeft(Math.max(0, left));
    };
    tick();
    const interval = setInterval(tick, 1000);
    return () => clearInterval(interval);
  }, [lastSendAt]);

  const selectedCount = OPTION_DEFS.filter((o) => selection[o.id]).length;

  const buildSubscriptions = (): PostSubscription[] => {
    if (subscribePost?.isNotebook) return getInitialNotebookSubscriptions();
    const defaults = getDefaultSubscriptionProps();
    const subscriptions: PostSubscription[] = [];
    if (selection.discussion) {
      subscriptions.push({
        type: PostSubscriptionType.NEW_COMMENTS,
        ...defaults[PostSubscriptionType.NEW_COMMENTS],
      });
    }
    if (selection.resolve) {
      subscriptions.push({
        type: PostSubscriptionType.STATUS_CHANGE,
        ...defaults[PostSubscriptionType.STATUS_CHANGE],
      });
    }
    if (selection.forecast) {
      subscriptions.push({
        type: PostSubscriptionType.CP_CHANGE,
        ...defaults[PostSubscriptionType.CP_CHANGE],
      });
    }
    return subscriptions;
  };

  const resolveGatedAction = (): GatedActionInput | null => {
    if (trigger === "post_subscribe" && subscribePost) {
      return {
        type: "post_subscribe",
        payload: {
          post: subscribePost.postId,
          subscriptions: buildSubscriptions(),
        },
      };
    }
    return gatedAction ?? pending?.gatedAction ?? null;
  };

  const validEmail = (value: string) =>
    /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value.trim());

  const performSend = async (
    email: string,
    action: GatedActionInput | null
  ) => {
    const response = await requestEmailLinkAction({
      email,
      redirectUrl,
      gatedAction: action,
      turnstileToken: turnstileTokenRef.current,
    });
    // Turnstile tokens are single-use: drop the spent one so a retry or resend
    // waits for the widget to issue a fresh one
    turnstileRef.current?.reset();
    turnstileTokenRef.current = undefined;
    setIsTurnstileValidated(!PUBLIC_TURNSTILE_SITE_KEY);
    if (response.errors) {
      setError("server");
      sendAnalyticsEvent("emailSubmitFailed", {
        trigger,
        surface,
        reason:
          typeof response.errors.email !== "undefined"
            ? "invalid_email"
            : String(response.errors.message ?? "").includes("captcha")
              ? "captcha_failed"
              : "unknown",
      });
      return false;
    }
    sentThisSessionRef.current = true;
    // Fires only on a confirmed send: this is the subscribe-capture
    // experiment's primary metric, so an optimistic fire would count
    // failures as conversions
    sendAnalyticsEvent("emailSubmitted", {
      trigger,
      surface,
      captureVariant: captureVariant ?? "none",
    });
    return true;
  };

  const onSubmit = () => {
    const storedEmail = pending?.email ?? "";
    // A stored address that no longer validates would strand the user: the
    // input and its error are both hidden while prefilled, so switch to the
    // editable field before surfacing the error
    if (prefilled && !validEmail(storedEmail)) {
      setEditingEmail(true);
      setDraft(storedEmail);
      setError("format");
      return;
    }
    const email = prefilled ? storedEmail : draft.trim();
    if (!validEmail(email)) {
      setError("format");
      sendAnalyticsEvent("emailSubmitFailed", {
        trigger,
        surface,
        reason: "invalid_email",
      });
      return;
    }
    setError(null);

    // Optimistic: the sent state (and the reminder banner behind it) appear
    // straight away and the request runs in the background. Only a failure
    // pulls the user back, with the address still in the field.
    const action = resolveGatedAction();
    const sendAt = Date.now();
    writePending({
      email,
      sentAt: sendAt,
      trigger,
      surface,
      gatedAction: action,
      redirectUrl,
    });
    setSentEmail(email);
    setLastSendAt(sendAt);
    setWasRepeatSend(prefilled || !!pending);
    setView("sent");

    void performSend(email, action).then((ok) => {
      if (ok) return;
      clearPending();
      setEditingEmail(true);
      setDraft(email);
      setView("input");
      toast.error(t("emailCaptureServerError"));
    });
  };

  const onResend = async () => {
    const record = readPending();
    if (!record) return;
    const ok = await performSend(record.email, record.gatedAction);
    if (!ok) return;
    // Restart the cooldown from this send, keeping the record's own context
    const sentAt = Date.now();
    writePending({ ...record, sentAt });
    setLastSendAt(sentAt);
    setResendFeedback(true);
  };
  const [resend, isResending] = useServerAction(onResend);

  const handleClose = () => {
    if (view !== "sent" && !sentThisSessionRef.current) {
      sendAnalyticsEvent("captureAbandoned", {
        trigger,
        surface,
        step: view === "options" ? "options" : "input",
      });
    }
    onClose();
  };

  // On mobile the registry unmounts us on close, which would cut the exit
  // animation short; play it first, then really close via onOpenChangeComplete
  const [sheetOpen, setSheetOpen] = useState(true);
  const requestClose = () => {
    if (isDesktop) {
      handleClose();
    } else {
      setSheetOpen(false);
    }
  };

  const handleContinue = () => {
    if (selectedCount === 0) return;
    sendAnalyticsEvent("subscribeOptionsContinued", {
      trigger,
      surface,
      selected: OPTION_DEFS.filter((o) => selection[o.id]).map((o) => o.id),
    });
    setView("input");
  };

  const handleGoogle = () => {
    if (!googleUrl) return;
    // Stashed even without an action: its presence is how the callback knows
    // the user arrived through the capture drawer rather than the full signup.
    stashSocialGatedAction({ gatedAction: resolveGatedAction(), trigger });
    window.location.href = googleUrl;
  };

  const inputCopy = (() => {
    const email = pending?.email ?? "";
    switch (trigger) {
      case "sign_in":
        return {
          title: t("emailCaptureSignInTitle"),
          body: prefilled
            ? t("emailCaptureBodyRepeat", { email })
            : t("emailCaptureSignInBody"),
          caption: t("emailCaptureSignInCaption"),
        };
      case "post_vote":
        return {
          title: t("emailCaptureVoteTitle"),
          body: prefilled
            ? t("emailCaptureVoteBodyRepeat", { email })
            : t("emailCaptureVoteBody"),
          caption: t("emailCaptureVoteCaption"),
        };
      case "forecast": {
        // Opened without a drafted forecast (untouched slider): the link only
        // signs the user in, so the copy must not promise saving anything
        const hasDraft = !!gatedAction;
        return {
          title: t("emailCaptureForecastTitle"),
          body: prefilled
            ? hasDraft
              ? t("emailCaptureForecastBodyRepeat", { email })
              : t("emailCaptureBodyRepeat", { email })
            : hasDraft
              ? t("emailCaptureForecastBody")
              : t("emailCaptureForecastBodyNoDraft"),
          caption: hasDraft
            ? t("emailCaptureForecastCaption")
            : t("emailCaptureSignInCaption"),
        };
      }
      default:
        return {
          title: t("emailCaptureSubscribeTitle"),
          body: prefilled
            ? t("emailCaptureSubscribeBodyRepeat", { email })
            : t("emailCaptureSubscribeBody"),
          caption: null,
        };
    }
  })();

  const sentAction = (() => {
    if (trigger === "post_vote") return t("emailCaptureSentActionVote");
    if (trigger === "sign_in") {
      // A pending action from an earlier gate still rides along, so name it
      const sentType = pending?.gatedAction?.type;
      if (sentType === "forecast") return t("emailCaptureSentActionForecast");
      if (sentType === "post_vote") return t("emailCaptureSentActionVote");
      if (sentType === "post_subscribe")
        return t("emailCaptureSentActionSubscribeAll");
      return t("emailCaptureSentActionSignInOnly");
    }
    if (trigger === "forecast") {
      // What actually went out: the fresh draft, else the still-pending
      // earlier action (resolveGatedAction keeps it so we never clear it)
      const sentType = (gatedAction ?? pending?.gatedAction)?.type;
      if (sentType === "forecast") return t("emailCaptureSentActionForecast");
      if (sentType === "post_vote") return t("emailCaptureSentActionVote");
      if (sentType === "post_subscribe")
        return t("emailCaptureSentActionSubscribeAll");
      return t("emailCaptureSentActionSignIn");
    }
    const picked = OPTION_DEFS.filter((o) => selection[o.id]);
    if (
      subscribePost?.isNotebook ||
      picked.length === 0 ||
      picked.length === 3
    ) {
      return t("emailCaptureSentActionSubscribeAll");
    }
    const phrases: Record<SubscribeOptionId, string> = {
      resolve: t("emailCapturePhraseResolve"),
      forecast: t("emailCapturePhraseForecast"),
      discussion: t("emailCapturePhraseDiscussion"),
    };
    const [first, second] = picked;
    return second
      ? t("emailCaptureSentActionSubscribeTwo", {
          a: phrases[first?.id ?? "resolve"],
          b: phrases[second.id],
        })
      : t("emailCaptureSentActionSubscribeOne", {
          a: phrases[first?.id ?? "resolve"],
        });
  })();

  const recapAction = (() => {
    const recapTrigger = pending?.trigger ?? trigger;
    if (recapTrigger === "sign_in") return t("emailCaptureRecapActionSignIn");
    if (recapTrigger === "post_vote") return t("emailCaptureRecapActionVote");
    if (recapTrigger === "forecast")
      return t("emailCaptureRecapActionForecast");
    return t("emailCaptureRecapActionSubscribe");
  })();

  const secondaryLink =
    "cursor-pointer border-none bg-transparent p-0.5 text-sm text-gray-600 underline underline-offset-4 dark:text-gray-600-dark";

  // Rendered by the send and resend views rather than once for the whole sheet,
  // so it sits with the button it guards instead of trailing the terms line.
  // Tokens are single-use; moving between those views remounts the widget,
  // which issues a fresh one - exactly what the next attempt needs.
  const turnstileNode = PUBLIC_TURNSTILE_SITE_KEY ? (
    <Turnstile
      ref={turnstileRef}
      siteKey={PUBLIC_TURNSTILE_SITE_KEY}
      // Renders nothing unless Cloudflare actually needs a challenge, so it
      // costs no chrome when it is not needed
      options={{ appearance: "interaction-only" }}
      className="self-center"
      onSuccess={(token) => {
        turnstileTokenRef.current = token;
        setIsTurnstileValidated(true);
      }}
      onError={() => setIsTurnstileValidated(false)}
      onExpire={() => setIsTurnstileValidated(false)}
    />
  ) : null;

  // On mobile the shell renders a header row (back or title, plus close); the
  // titles below only render inline on desktop, where BaseModal has no header
  const backInHeader = view === "input" && hasOptionsStep;
  const headerTitle =
    view === "options"
      ? t("emailCaptureOptionsTitle")
      : view === "sent"
        ? t("emailCaptureSentTitle")
        : inputCopy.title;

  const goBackToOptions = () => {
    setError(null);
    setView("options");
  };

  const content = (
    <div className="flex flex-col gap-3.5 pt-0.5">
      {isDesktop && backInHeader && (
        <button
          onClick={goBackToOptions}
          className="flex w-fit items-center gap-1.5 border-none bg-transparent p-1 text-sm font-medium text-blue-800 dark:text-blue-800-dark"
        >
          <FontAwesomeIcon icon={faArrowLeft} size="sm" />
          {t("emailCaptureBack")}
        </button>
      )}

      {view === "options" && (
        <>
          <div className="flex flex-col gap-1.5">
            {isDesktop && (
              <h2 className="m-0 text-xl font-bold tracking-tight">
                {t("emailCaptureOptionsTitle")}
              </h2>
            )}
            <p className="m-0 text-sm leading-relaxed text-gray-700 dark:text-gray-700-dark">
              {t("emailCaptureOptionsSubtitle")}
            </p>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {OPTION_DEFS.map((option) => {
              const isOn = selection[option.id];
              return (
                <button
                  key={option.id}
                  role="checkbox"
                  aria-checked={isOn}
                  onClick={() =>
                    setSelection((prev) => ({
                      ...prev,
                      [option.id]: !prev[option.id],
                    }))
                  }
                  className={cn(
                    "flex min-h-[92px] cursor-pointer flex-col items-center justify-center gap-2.5 rounded border px-2 py-3 text-center text-sm font-semibold leading-snug",
                    isOn
                      ? "border-blue-900 bg-blue-900 text-gray-0 dark:border-blue-900-dark dark:bg-blue-900-dark dark:text-gray-0-dark"
                      : "border-blue-400 bg-gray-100 text-blue-900 dark:border-blue-400-dark dark:bg-gray-100-dark dark:text-blue-900-dark"
                  )}
                >
                  <span
                    className={cn(
                      "flex size-5 flex-none items-center justify-center rounded-sm border bg-gray-0 dark:bg-gray-0-dark",
                      isOn
                        ? "border-gray-0 dark:border-gray-0-dark"
                        : "border-gray-500 dark:border-gray-500-dark"
                    )}
                  >
                    {isOn && (
                      <FontAwesomeIcon
                        icon={faCheck}
                        className="text-xs text-blue-900 dark:text-blue-900-dark"
                      />
                    )}
                  </span>
                  {t(option.labelKey)}
                </button>
              );
            })}
          </div>
          <Button
            variant="primary"
            className="w-full"
            disabled={selectedCount === 0}
            onClick={handleContinue}
          >
            {t("emailCaptureOptionsContinue")}
          </Button>
          {selectedCount === 0 && (
            <span className="text-center text-xs text-gray-500 dark:text-gray-500-dark">
              {t("emailCaptureOptionsCaptionNone")}
            </span>
          )}
        </>
      )}

      {view === "input" && (
        <>
          <div className="flex flex-col gap-1.5">
            {(isDesktop || backInHeader) && (
              <h2 className="m-0 text-xl font-bold tracking-tight">
                {inputCopy.title}
              </h2>
            )}
            <p className="m-0 text-sm leading-relaxed text-gray-700 dark:text-gray-700-dark">
              {inputCopy.body}
            </p>
          </div>
          {error === "server" && (
            <div className="flex items-start gap-2 rounded border border-salmon-400 bg-salmon-200 px-3 py-2.5 text-xs leading-snug text-salmon-800 dark:border-salmon-400-dark dark:bg-salmon-200-dark dark:text-salmon-800-dark">
              {t("emailCaptureServerError")}
            </div>
          )}
          {!prefilled && (
            <div className="flex flex-col gap-1.5">
              <label
                htmlFor="email-capture-input"
                className="text-xs font-semibold text-gray-700 dark:text-gray-700-dark"
              >
                {t("emailCaptureEmailLabel")}
              </label>
              <Input
                id="email-capture-input"
                type="email"
                inputMode="email"
                autoComplete="email"
                placeholder="you@example.com"
                value={draft}
                onChange={(e) => {
                  setDraft(e.target.value);
                  if (error === "format") setError(null);
                }}
                // The field is not inside a <form>, so Enter needs wiring
                onKeyDown={(e) => {
                  if (e.key === "Enter" && isTurnstileValidated) {
                    e.preventDefault();
                    onSubmit();
                  }
                }}
                className={cn(
                  "h-12 w-full rounded border-[1.5px] bg-gray-0 px-3.5 text-base text-gray-900 dark:bg-gray-0-dark dark:text-gray-900-dark",
                  error === "format"
                    ? "border-salmon-500 dark:border-salmon-500-dark"
                    : "border-gray-400 dark:border-gray-400-dark"
                )}
              />
              {error === "format" && (
                <span className="text-xs text-salmon-800 dark:text-salmon-800-dark">
                  {t("emailCaptureFormatError")}
                </span>
              )}
            </div>
          )}
          <Button
            variant="primary"
            className="w-full"
            disabled={!isTurnstileValidated}
            onClick={onSubmit}
          >
            {error === "server"
              ? t("emailCaptureTryAgain")
              : prefilled
                ? t("emailCaptureSendNew")
                : t("emailCaptureSend")}
          </Button>
          {prefilled && (
            <button
              onClick={() => {
                setEditingEmail(true);
                setDraft("");
              }}
              className={cn(secondaryLink, "self-center")}
            >
              {t("emailCaptureUseDifferentEmail")}
            </button>
          )}
          {inputCopy.caption && (
            <span className="text-center text-xs text-gray-500 dark:text-gray-500-dark">
              {inputCopy.caption}
            </span>
          )}
          {turnstileNode}
          {googleUrl && (
            <>
              <div className="flex items-center gap-2.5">
                <div className="h-px flex-1 bg-gray-300 dark:bg-gray-300-dark" />
                <span className="text-xs text-gray-500 dark:text-gray-500-dark">
                  {t("or")}
                </span>
                <div className="h-px flex-1 bg-gray-300 dark:bg-gray-300-dark" />
              </div>
              <Button
                variant="tertiary"
                className="w-full"
                onClick={handleGoogle}
              >
                <Google className="mr-2 flex-none" />
                {t("emailCaptureGoogle")}
              </Button>
            </>
          )}
          <button
            onClick={() => setCurrentModal({ type: "signin" })}
            className={cn(secondaryLink, "self-center")}
          >
            {t("emailCapturePassword")}
          </button>
          <span className="text-balance text-center text-xs leading-relaxed text-gray-500 dark:text-gray-500-dark">
            {t.rich("registrationTerms", {
              terms: (chunks) => (
                <Link target="_blank" href={"/terms-of-use/"}>
                  {chunks}
                </Link>
              ),
              privacy: (chunks) => (
                <Link target="_blank" href={"/privacy-policy/"}>
                  {chunks}
                </Link>
              ),
            })}
          </span>
        </>
      )}

      {view === "sent" && (
        <>
          <div className="flex flex-col gap-1.5">
            {isDesktop && (
              <h2 className="m-0 text-xl font-bold tracking-tight">
                {t("emailCaptureSentTitle")}
              </h2>
            )}
            <p className="m-0 text-sm leading-relaxed text-gray-700 dark:text-gray-700-dark">
              {openedAsRecap
                ? `${t("emailCaptureRecapSentTo", { email: sentEmail ?? "" })} ${recapAction}`
                : `${t("emailCaptureSentBody", { email: sentEmail ?? "" })} ${sentAction}`}
            </p>
            {!openedAsRecap && (
              <p className="m-0 text-xs leading-relaxed text-gray-500 dark:text-gray-500-dark">
                {wasRepeatSend
                  ? t("emailCaptureSentNoteRepeat")
                  : t("emailCaptureSentNote")}
              </p>
            )}
          </div>
          {openedAsRecap ? (
            <>
              {resendFeedback && (
                <div className="flex items-center gap-2 rounded border border-mint-500 bg-mint-200 px-3 py-2.5 text-xs font-semibold text-mint-800 dark:border-mint-500-dark dark:bg-mint-200-dark dark:text-mint-800-dark">
                  {t("emailCaptureResendFeedback", { email: sentEmail ?? "" })}
                </div>
              )}
              {error === "server" && (
                <div className="flex items-start gap-2 rounded border border-salmon-400 bg-salmon-200 px-3 py-2.5 text-xs leading-snug text-salmon-800 dark:border-salmon-400-dark dark:bg-salmon-200-dark dark:text-salmon-800-dark">
                  {t("emailCaptureServerError")}
                </div>
              )}
              {turnstileNode}
              <Button
                variant="primary"
                className="w-full"
                disabled={
                  cooldownLeft > 0 || isResending || !isTurnstileValidated
                }
                onClick={resend}
              >
                {cooldownLeft > 0
                  ? t("emailCaptureResendIn", { seconds: cooldownLeft })
                  : t("emailCaptureResend")}
              </Button>
              <button
                onClick={() => {
                  setEditingEmail(true);
                  setDraft("");
                  setView("input");
                }}
                className={cn(secondaryLink, "self-center")}
              >
                {t("emailCaptureUseDifferentEmail")}
              </button>
            </>
          ) : (
            <>
              <button
                onClick={() => {
                  setEditingEmail(true);
                  setDraft("");
                  setView("input");
                }}
                className={cn(secondaryLink, "self-center")}
              >
                {t("emailCaptureWrongAddress")}
              </button>
            </>
          )}
        </>
      )}
    </div>
  );

  if (isDesktop) {
    return (
      <BaseModal
        isOpen={isOpen}
        onClose={handleClose}
        className="w-full max-w-md"
      >
        {content}
      </BaseModal>
    );
  }

  return (
    <BottomDrawer
      open={isOpen && sheetOpen}
      onOpenChange={(open) => {
        if (!open) setSheetOpen(false);
      }}
      onOpenChangeComplete={(open) => {
        if (!open && !sheetOpen) handleClose();
      }}
      label={headerTitle}
    >
      <div className="flex items-start justify-between gap-3 pt-0.5">
        {backInHeader ? (
          <button
            onClick={goBackToOptions}
            className="flex w-fit items-center gap-1.5 self-center border-none bg-transparent p-1 text-sm font-medium text-blue-800 dark:text-blue-800-dark"
          >
            <FontAwesomeIcon icon={faArrowLeft} size="sm" />
            {t("emailCaptureBack")}
          </button>
        ) : (
          <h2 className="m-0 text-xl font-bold tracking-tight">
            {headerTitle}
          </h2>
        )}
        <button
          onClick={requestClose}
          aria-label={t("close")}
          className="flex size-8 flex-none items-center justify-center rounded-full border-none bg-gray-200 text-gray-600 dark:bg-gray-200-dark dark:text-gray-600-dark"
        >
          ✕
        </button>
      </div>
      {content}
    </BottomDrawer>
  );
};

export default EmailCaptureDrawer;
