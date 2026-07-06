"use client";

import { GoogleTagManager as NextGoogleTagManager } from "@next/third-parties/google";
import { FC } from "react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";
import { usePublicSettings } from "@/contexts/public_settings_context";
import useMounted from "@/hooks/use_mounted";

const GoogleTagManager: FC = () => {
  // Only read consent after mount to avoid SSR/client hydration mismatch.
  // A re-render (e.g. router.refresh() from the cookies banner) re-reads the
  // stored consent value, so GTM loads as soon as consent is granted.
  const mounted = useMounted();
  const { PUBLIC_GTM_ID } = usePublicSettings();

  const consent = mounted ? getAnalyticsCookieConsentGiven() : "undecided";

  if (consent !== "yes" || !PUBLIC_GTM_ID) {
    return null;
  }

  return <NextGoogleTagManager gtmId={PUBLIC_GTM_ID} />;
};

export default GoogleTagManager;
