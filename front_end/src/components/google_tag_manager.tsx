"use client";

import { GoogleTagManager as NextGoogleTagManager } from "@next/third-parties/google";
import { FC } from "react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";
import useMounted from "@/hooks/use_mounted";

const GTM_ID = "GTM-TZ78RVG";

const GoogleTagManager: FC = () => {
  // Only read consent after mount to avoid SSR/client hydration mismatch.
  // A re-render (e.g. router.refresh() from the cookies banner) re-reads the
  // stored consent value, so GTM loads as soon as consent is granted.
  const mounted = useMounted();
  const consent = mounted ? getAnalyticsCookieConsentGiven() : "undecided";

  if (consent !== "yes") {
    return null;
  }

  return <NextGoogleTagManager gtmId={GTM_ID} />;
};

export default GoogleTagManager;
