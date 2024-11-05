"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { useEffect } from "react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";

export function CSPostHogProvider({ children }: { children: any }) {
  useEffect(() => {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "/ingest",
      ui_host: process.env.NEXT_PUBLIC_POSTHOG_HOST
        ? undefined
        : "https://us.posthog.com",
      // set to 'always' to create profiles for anonymous users as well
      person_profiles: "identified_only",
      // Disable automatic pageview capture, as we capture manually
      capture_pageview: false,
      persistence:
        getAnalyticsCookieConsentGiven() === "yes"
          ? "localStorage+cookie"
          : "memory",
    });
  }, []);

  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
