"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { ReactNode, useEffect } from "react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";
import SuspendedPostHogPageView from "@/components/posthog_page_view";
import { getPublicSetting } from "@/components/public_settings_script";
import {
  AUTOTRANSLATION_FLAG_KEY,
  AutotranslationAssignment,
} from "@/constants/experiments";

function CSPostHogProvider({
  children,
  locale,
  autotranslationAssignment,
}: {
  children: ReactNode;
  locale: string;
  autotranslationAssignment?: AutotranslationAssignment;
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
        persistence:
          getAnalyticsCookieConsentGiven() === "yes"
            ? "localStorage+cookie"
            : "memory",
        // Reuse the server-side experiment assignment: the same distinct_id
        // keeps identity stable across visits under memory persistence, and
        // the bootstrapped flag stamps $feature/... on events from the start
        ...(autotranslationAssignment && {
          bootstrap: {
            distinctID: autotranslationAssignment.distinctId,
            isIdentifiedID: false,
            featureFlags: {
              [AUTOTRANSLATION_FLAG_KEY]: autotranslationAssignment.variant,
            },
          },
        }),
      });

      if (autotranslationAssignment) {
        // Captures $feature_flag_called so PostHog registers exposure
        posthog.getFeatureFlag(AUTOTRANSLATION_FLAG_KEY);
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <SuspendedPostHogPageView locale={locale} />
      {children}
    </PostHogProvider>
  );
}

export default CSPostHogProvider;
