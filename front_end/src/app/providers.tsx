"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";

export function CSPostHogProvider({ children }: { children: any }) {
  if (typeof window !== "undefined" && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      // set to 'always' to create profiles for anonymous users as well
      person_profiles: "identified_only",
      // TODO: uncomment once we want to support cookies configuration
      // persistence:
      //   getAnalyticsCookieConsentGiven() === "yes"
      //     ? "localStorage+cookie"
      //     : "memory",
    });
  }
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
