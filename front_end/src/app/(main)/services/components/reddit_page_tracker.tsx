"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";
import { usePublicSettings } from "@/contexts/public_settings_context";

import {
  ANALYTICS_CONSENT_CHANGED,
  isTrackedServicesPath,
  trackServicesPageVisit,
} from "./reddit_pixel";

export default function RedditPageTracker() {
  const pathname = usePathname();
  const { PUBLIC_REDDIT_SERVICES_PIXEL_ID: pixelId } = usePublicSettings();
  const [hasConsent, setHasConsent] = useState(false);
  const lastTrackedPath = useRef<string | null>(null);

  useEffect(() => {
    const updateConsent = () => {
      setHasConsent(getAnalyticsCookieConsentGiven() === "yes");
    };

    updateConsent();
    window.addEventListener(ANALYTICS_CONSENT_CHANGED, updateConsent);
    window.addEventListener("storage", updateConsent);

    return () => {
      window.removeEventListener(ANALYTICS_CONSENT_CHANGED, updateConsent);
      window.removeEventListener("storage", updateConsent);
    };
  }, []);

  useEffect(() => {
    if (!hasConsent || !pixelId || !isTrackedServicesPath(pathname)) {
      lastTrackedPath.current = null;
      return;
    }

    if (lastTrackedPath.current === pathname) return;

    trackServicesPageVisit(pixelId);
    lastTrackedPath.current = pathname;
  }, [hasConsent, pathname, pixelId]);

  return null;
}
