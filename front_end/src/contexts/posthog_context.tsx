"use client";
import posthog, { type PostHogInterface } from "posthog-js";
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
import { PostHogIdentity } from "@/utils/posthog_identity";

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
  identity,
}: {
  children: ReactNode;
  locale: string;
  // The logged-in user, or null when logged out
  identity: PostHogIdentity | null;
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
        loaded: (ph: PostHogInterface) => {
          if (identity && ph.get_distinct_id() !== identity.distinctId) {
            // Identify here rather than relying on AuthProvider alone: it is
            // a child, so its effect runs before this init and its identify()
            // is dropped by the not-yet-loaded SDK. When bootstrapped, this
            // merges the experiment's anonymous id into the user, keeping
            // pre-login exposures attributed to them. Skipped when already
            // identified as this user, to avoid a $set event per page load
            ph.identify(identity.distinctId, identity.properties);
          }
          if (bootstrapAssignment) {
            // Bootstrapping marks flags as loaded, which makes posthog-js skip
            // the initial /flags request. Reload so flags absent from the
            // bootstrap (e.g. survey-linked flags) resolve instead of reading
            // as missing. Debounced with identify()'s own reload
            ph.reloadFeatureFlags();
          }
        },
      });

      if (autotranslationAssignment) {
        // Captures $feature_flag_called so PostHog registers exposure.
        // The subscribe-capture experiment registers exposure only when
        // one of its surfaces is shown (registerSubscribeCaptureExposure)
        posthog.getFeatureFlag(AUTOTRANSLATION_FLAG_KEY);
      }
    }
    // Init once per page load; identity changes later are handled by
    // AuthProvider's identify()/reset()
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
