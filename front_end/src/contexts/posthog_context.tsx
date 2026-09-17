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
  ExperimentAssignment,
  parseAssignment,
  SUBSCRIBE_CAPTURE_COOKIE_NAME,
  SUBSCRIBE_CAPTURE_FLAG_KEY,
} from "@/constants/experiments";
import { safeDocumentCookie } from "@/utils/core/storage";

// Experiment assignments are pinned in first-party cookies by the
// middleware (proxy.ts) when an eligible visitor is enrolled
function getAssignmentCookie(cookieName: string): ExperimentAssignment | null {
  const raw = safeDocumentCookie.get(cookieName);
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
      const autotranslationAssignment = getAssignmentCookie(
        AUTOTRANSLATION_COOKIE_NAME
      );
      const subscribeCaptureAssignment = getAssignmentCookie(
        SUBSCRIBE_CAPTURE_COOKIE_NAME
      );
      // Both enrollments share one identity by construction (proxy.ts)
      const bootstrapAssignment =
        autotranslationAssignment ?? subscribeCaptureAssignment;

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
        // the bootstrapped flags stamp $feature/... on events from the start
        ...(bootstrapAssignment && {
          bootstrap: {
            distinctID: bootstrapAssignment.distinctId,
            isIdentifiedID: false,
            featureFlags: {
              ...(autotranslationAssignment && {
                [AUTOTRANSLATION_FLAG_KEY]: autotranslationAssignment.variant,
              }),
              ...(subscribeCaptureAssignment && {
                [SUBSCRIBE_CAPTURE_FLAG_KEY]:
                  subscribeCaptureAssignment.variant,
              }),
            },
          },
        }),
      });

      if (autotranslationAssignment) {
        // Captures $feature_flag_called so PostHog registers exposure.
        // The subscribe-capture experiment registers exposure only when
        // one of its surfaces is shown (registerSubscribeCaptureExposure)
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
