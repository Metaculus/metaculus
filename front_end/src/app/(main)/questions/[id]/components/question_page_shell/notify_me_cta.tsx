"use client";

import { faBell as faBellRegular } from "@fortawesome/free-regular-svg-icons";
import { faBell, faCheck } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import { FC, useEffect, useRef } from "react";

import {
  registerSubscribeCaptureExposure,
  useSubscribeCaptureVariant,
} from "@/contexts/experiments_context";
import { usePostSubscriptionContext } from "@/contexts/post_subscription_context";
import { useBreakpoint } from "@/hooks/tailwind";
import useMounted from "@/hooks/use_mounted";
import { sendAnalyticsEvent } from "@/utils/analytics";
import cn from "@/utils/core/cn";

type Props = {
  className?: string;
};

/**
 * Consumer subscribe entry point for viewports where the Follow pill is
 * hidden. Logged-out taps open the email-capture drawer via the subscription
 * context; signed-in taps subscribe directly.
 */
const NotifyMeCta: FC<Props> = ({ className }) => {
  const t = useTranslations();
  const { isSubscribed, isLoading, handleSubscribe, handleCustomize } =
    usePostSubscriptionContext();
  const captureVariant = useSubscribeCaptureVariant();
  const isMounted = useMounted();
  // The CTA is md:hidden, so desktop mounts it without ever showing it. Those
  // visitors stay in the experiment (they reach it via the Follow pill), but
  // the events carry the viewport so the two can be analysed separately.
  const isDesktopViewport = useBreakpoint("md");
  const shownTrackedRef = useRef(false);
  const exposureTrackedRef = useRef(false);

  useEffect(() => {
    // useBreakpoint is false until after mount, so wait for a true reading
    if (!isMounted) return;

    if (!shownTrackedRef.current) {
      shownTrackedRef.current = true;
      sendAnalyticsEvent("notifyCtaShown", {
        surface: "questionPageCta",
        captureVariant: captureVariant ?? "none",
        viewport: isDesktopViewport ? "desktop" : "mobile",
      });
    }
    if (captureVariant && !exposureTrackedRef.current) {
      exposureTrackedRef.current = true;
      registerSubscribeCaptureExposure();
    }
  }, [captureVariant, isMounted, isDesktopViewport]);

  if (isSubscribed) {
    return (
      <button
        onClick={handleCustomize}
        className={cn(
          "flex w-full cursor-pointer items-center gap-3 rounded-lg border border-mint-500 bg-mint-200 px-3.5 py-3 text-left dark:border-mint-500-dark dark:bg-mint-200-dark",
          className
        )}
      >
        <FontAwesomeIcon
          icon={faBell}
          className="flex-none text-mint-800 dark:text-mint-800-dark"
        />
        <span className="flex-1 text-sm font-semibold text-mint-800 dark:text-mint-800-dark">
          {t("notifyMeCtaFollowing")}
        </span>
        <FontAwesomeIcon
          icon={faCheck}
          className="flex-none text-mint-800 dark:text-mint-800-dark"
        />
      </button>
    );
  }

  return (
    <button
      onClick={() => {
        sendAnalyticsEvent("notifyCtaClicked", {
          surface: "questionPageCta",
          captureVariant: captureVariant ?? "none",
          viewport: isDesktopViewport ? "desktop" : "mobile",
        });
        void handleSubscribe();
      }}
      disabled={isLoading}
      className={cn(
        "flex h-[46px] w-full cursor-pointer items-center justify-center gap-2 rounded-full border border-blue-500 bg-blue-300 text-sm font-semibold text-blue-800 disabled:opacity-60 dark:border-blue-500-dark dark:bg-blue-300-dark dark:text-blue-800-dark",
        className
      )}
    >
      <FontAwesomeIcon icon={faBellRegular} />
      {captureVariant === "control"
        ? t("notifyMeCtaLabelUpdates")
        : t("notifyMeCtaLabel")}
    </button>
  );
};

export default NotifyMeCta;
