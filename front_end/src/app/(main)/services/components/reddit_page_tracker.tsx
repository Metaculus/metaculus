"use client";

import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";

import {
  ANALYTICS_CONSENT_CHANGED,
  isTrackedServicesPath,
  trackServicesContactArrival,
  trackServicesPageVisit,
} from "./reddit_pixel";

export default function RedditPageTracker() {
  const pathname = usePathname();
  const [hasConsent, setHasConsent] = useState(false);
  const previousPath = useRef<string | null>(null);
  const directArrivalPath = useRef<string | null>(null);
  const directArrivalTracked = useRef(false);

  useEffect(() => {
    if (
      isTrackedServicesPath(window.location.pathname) &&
      window.location.hash === "#contact-us"
    ) {
      directArrivalPath.current = window.location.pathname;
    }

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
    const isClientNavigation =
      previousPath.current !== null && previousPath.current !== pathname;
    previousPath.current = pathname;

    if (isClientNavigation) {
      directArrivalPath.current = null;
    }

    if (
      hasConsent &&
      !directArrivalTracked.current &&
      directArrivalPath.current === pathname
    ) {
      directArrivalTracked.current = true;
      trackServicesContactArrival();
    }

    if (isClientNavigation && hasConsent && isTrackedServicesPath(pathname)) {
      trackServicesPageVisit(pathname);
    }
  }, [hasConsent, pathname]);

  return null;
}
