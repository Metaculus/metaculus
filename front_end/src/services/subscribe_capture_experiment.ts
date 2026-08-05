import "server-only";

import { NextRequest, NextResponse } from "next/server";

import {
  AUTOTRANSLATION_COOKIE_NAME,
  ExperimentAssignment,
  parseAssignment,
  serializeAssignment,
  SUBSCRIBE_CAPTURE_COOKIE_MAX_AGE,
  SUBSCRIBE_CAPTURE_COOKIE_NAME,
  SUBSCRIBE_CAPTURE_FLAG_KEY,
} from "@/constants/experiments";
import { AuthCookieReader } from "@/services/auth_tokens";
import {
  getPostHogDistinctIdFromCookie,
  isBotUserAgent,
} from "@/services/autotranslation_experiment";
import { getFeatureFlagVariantForDistinctId } from "@/utils/posthog.server";
import { getPublicSettings } from "@/utils/public_settings.server";

export function setSubscribeCaptureCookieInResponse(
  response: NextResponse,
  assignment: ExperimentAssignment
): void {
  response.cookies.set(
    SUBSCRIBE_CAPTURE_COOKIE_NAME,
    serializeAssignment(assignment),
    {
      maxAge: SUBSCRIBE_CAPTURE_COOKIE_MAX_AGE,
      // Readable by the PostHog provider, which bootstraps from it client-side
      httpOnly: false,
      secure: true,
      sameSite: "lax",
      path: "/",
    }
  );
}

/**
 * Enrolls eligible anonymous document requests into the subscribe-capture
 * flow experiment. Returns null when ineligible, already enrolled, or when
 * flag evaluation fails (fail open: the status-quo flow is served and
 * enrollment is retried on the next visit).
 *
 * Identity: reuses, in order, the id the auto-translation enrollment minted
 * on this same request, the PostHog cookie id, or the other experiment's
 * cookie id, so one visitor never carries two distinct_ids.
 */
export async function getSubscribeCaptureEnrollment(
  request: NextRequest,
  requestAuth: AuthCookieReader,
  isDocumentRequest: boolean,
  sharedDistinctId?: string | null
): Promise<ExperimentAssignment | null> {
  const { PUBLIC_AUTHENTICATION_REQUIRED, PUBLIC_POSTHOG_KEY } =
    getPublicSettings();

  if (
    PUBLIC_AUTHENTICATION_REQUIRED ||
    !isDocumentRequest ||
    requestAuth.hasAuthSession() ||
    isBotUserAgent(request.headers.get("user-agent") ?? "") ||
    parseAssignment(request.cookies.get(SUBSCRIBE_CAPTURE_COOKIE_NAME)?.value)
  ) {
    return null;
  }

  const distinctId =
    sharedDistinctId ??
    getPostHogDistinctIdFromCookie(request, PUBLIC_POSTHOG_KEY) ??
    parseAssignment(request.cookies.get(AUTOTRANSLATION_COOKIE_NAME)?.value)
      ?.distinctId ??
    crypto.randomUUID();

  const variant = await getFeatureFlagVariantForDistinctId(
    SUBSCRIBE_CAPTURE_FLAG_KEY,
    distinctId
  );
  if (variant !== "control" && variant !== "test") {
    return null;
  }

  return { distinctId, variant };
}
