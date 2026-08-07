"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";
import { ReactNode, useEffect } from "react";

import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";
import SuspendedPostHogPageView from "@/components/posthog_page_view";
import { getPublicSetting } from "@/components/public_settings_script";
import {
  AUTOTRANSLATION_COOKIE_NAME,
  AUTOTRANSLATION_FLAG_KEY,
  AutotranslationAssignment,
  parseAssignment,
} from "@/constants/experiments";

// The auto-translation experiment assignment is pinned in a first-party
// cookie by the middleware (proxy.ts) when an eligible visitor is enrolled
function getAutotranslationAssignment(): AutotranslationAssignment | null {
  const raw = document.cookie
    .split("; ")
    .find((cookie) => cookie.startsWith(`${AUTOTRANSLATION_COOKIE_NAME}=`))
    ?.slice(AUTOTRANSLATION_COOKIE_NAME.length + 1);
  if (!raw) return null;

  try {
    // Next.js URL-encodes cookie values when setting; document.cookie
    // returns them still encoded
    return parseAssignment(decodeURIComponent(raw));
  } catch {
    return null;
  }
}

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
      const autotranslationAssignment = getAutotranslationAssignment();

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
  }, []);

  return (
    <PostHogProvider client={posthog}>
      <SuspendedPostHogPageView locale={locale} />
      {children}
    </PostHogProvider>
  );
}

export default CSPostHogProvider;
