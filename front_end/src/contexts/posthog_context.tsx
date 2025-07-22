"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { ReactNode, useEffect } from "react";

import SuspendedPostHogPageView from "@/components/posthog_page_view";
import { getPublicSetting } from "@/components/public_settings_script";

import { getCookiesConsentStatistics } from "./cookies_context";

function CSPostHogProvider({
  children,
  locale,
}: {
  children: ReactNode;
  locale: string;
}) {
  useEffect(() => {
    const PUBLIC_POSTHOG_KEY = getPublicSetting("PUBLIC_POSTHOG_KEY");
    const PUBLIC_POSTHOG_BASE_URL = getPublicSetting("PUBLIC_POSTHOG_BASE_URL");

    if (PUBLIC_POSTHOG_KEY) {
      posthog.init(PUBLIC_POSTHOG_KEY, {
        api_host: PUBLIC_POSTHOG_BASE_URL,
        ui_host: "https://us.posthog.com",
        // set to 'always' to create profiles for anonymous users as well
        person_profiles: "always",
        // Disable automatic pageview capture, as we capture manually
        capture_pageview: false,
        persistence: getCookiesConsentStatistics()
          ? "localStorage+cookie"
          : "memory",
      });
    }
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <SuspendedPostHogPageView locale={locale} />
      {children}
    </PostHogProvider>
  );
}

export default CSPostHogProvider;
