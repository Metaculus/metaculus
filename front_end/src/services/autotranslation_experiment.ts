import "server-only";

import { NextRequest, NextResponse } from "next/server";

import {
  AUTOTRANSLATION_COOKIE_MAX_AGE,
  AUTOTRANSLATION_COOKIE_NAME,
  AUTOTRANSLATION_FLAG_KEY,
  AUTOTRANSLATION_TARGET_LOCALES,
  AUTOTRANSLATION_VARIANTS,
  AutotranslationAssignment,
  AutotranslationVariant,
} from "@/constants/experiments";
import { AuthCookieReader } from "@/services/auth_tokens";
import {
  LOCALE_COOKIE_NAME,
  negotiateLocale,
} from "@/services/language_service";
import { getFeatureFlagVariantForDistinctId } from "@/utils/posthog_node_client";
import { getPublicSettings } from "@/utils/public_settings.server";

export function parseAssignment(
  raw: string | undefined
): AutotranslationAssignment | null {
  if (!raw) return null;

  const separatorIndex = raw.lastIndexOf(":");
  if (separatorIndex <= 0) return null;

  try {
    const distinctId = decodeURIComponent(raw.slice(0, separatorIndex));
    const variant = raw.slice(separatorIndex + 1) as AutotranslationVariant;
    if (!distinctId || !AUTOTRANSLATION_VARIANTS.includes(variant)) {
      return null;
    }
    return { distinctId, variant };
  } catch {
    return null;
  }
}

export function serializeAssignment(
  assignment: AutotranslationAssignment
): string {
  return `${encodeURIComponent(assignment.distinctId)}:${assignment.variant}`;
}

export function setAssignmentCookieInResponse(
  response: NextResponse,
  assignment: AutotranslationAssignment
): void {
  response.cookies.set(
    AUTOTRANSLATION_COOKIE_NAME,
    serializeAssignment(assignment),
    {
      maxAge: AUTOTRANSLATION_COOKIE_MAX_AGE,
      httpOnly: true,
      secure: true,
      sameSite: "lax",
      path: "/",
    }
  );
}

// Deliberately does not match plain HTTP clients like curl so the
// enrollment flow stays testable from the command line
const BOT_UA_REGEX =
  /bot|crawl|spider|slurp|bingpreview|facebookexternalhit|headless|lighthouse|prerender/i;

export function isBotUserAgent(userAgent: string): boolean {
  return BOT_UA_REGEX.test(userAgent);
}

function getPostHogDistinctIdFromCookie(
  request: NextRequest,
  posthogKey: string
): string | null {
  if (!posthogKey) return null;

  const rawCookie = request.cookies.get(`ph_${posthogKey}_posthog`)?.value;
  if (!rawCookie) return null;

  try {
    const distinctId: unknown = JSON.parse(rawCookie)?.distinct_id;
    return typeof distinctId === "string" && distinctId ? distinctId : null;
  } catch {
    return null;
  }
}

/**
 * Decides whether this request should be enrolled in the auto-translation
 * experiment and, if so, resolves the variant from PostHog.
 *
 * Eligible: anonymous document requests with no explicit language preference
 * (no NEXT_LOCALE cookie, no ?locale= param) whose Accept-Language negotiates
 * to one of the target locales. Returns null when ineligible, already
 * enrolled, or when flag evaluation fails (fail open: status quo is served
 * and enrollment is retried on the next visit).
 */
export async function getAutotranslationEnrollment(
  request: NextRequest,
  requestAuth: AuthCookieReader,
  isDocumentRequest: boolean
): Promise<AutotranslationAssignment | null> {
  const { PUBLIC_AUTHENTICATION_REQUIRED, PUBLIC_POSTHOG_KEY } =
    getPublicSettings();

  if (
    PUBLIC_AUTHENTICATION_REQUIRED ||
    !isDocumentRequest ||
    requestAuth.hasAuthSession() ||
    isBotUserAgent(request.headers.get("user-agent") ?? "") ||
    request.cookies.has(LOCALE_COOKIE_NAME) ||
    request.nextUrl.searchParams.has("locale") ||
    parseAssignment(request.cookies.get(AUTOTRANSLATION_COOKIE_NAME)?.value)
  ) {
    return null;
  }

  const negotiated = negotiateLocale(request.headers.get("accept-language"));
  if (!AUTOTRANSLATION_TARGET_LOCALES.includes(negotiated)) {
    return null;
  }

  // Reuse the identity of a previously-consented visitor so their
  // analytics history stays continuous; otherwise mint a device id
  const distinctId =
    getPostHogDistinctIdFromCookie(request, PUBLIC_POSTHOG_KEY) ??
    crypto.randomUUID();

  const variant = await getFeatureFlagVariantForDistinctId(
    AUTOTRANSLATION_FLAG_KEY,
    distinctId
  );
  if (variant !== "control" && variant !== "test") {
    return null;
  }

  return { distinctId, variant };
}
