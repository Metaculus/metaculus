import "server-only";

import { cookies, headers } from "next/headers";

import {
  EXPERIMENT_VARIANTS,
  ExperimentVariant,
  parseAssignment,
  SUBSCRIBE_CAPTURE_COOKIE_NAME,
  SUBSCRIBE_CAPTURE_HEADER,
} from "@/constants/experiments";
import { AuthCookieReader } from "@/services/auth_tokens";

// Kept separate from subscribe_capture_experiment.ts on purpose: that module
// is imported by the middleware (proxy.ts), and pulling next/headers into the
// middleware bundle marks unrelated static routes as dynamic at build time.

/**
 * Resolves the request's variant for server rendering. Call from routes that
 * are already dynamic (it reads headers/cookies): the header carries the
 * variant on the enrollment request itself, the cookie on later visits.
 * Null for signed-in visitors and the unenrolled: serve the status quo.
 */
export async function getSubscribeCaptureVariantForRequest(): Promise<ExperimentVariant | null> {
  const requestHeaders = await headers();
  const cookieStore = await cookies();

  // Access OR refresh token, matching the middleware's enrollment check
  if (new AuthCookieReader(cookieStore).hasAuthSession()) {
    return null;
  }

  const headerVariant = requestHeaders.get(SUBSCRIBE_CAPTURE_HEADER);
  if (headerVariant && EXPERIMENT_VARIANTS.includes(headerVariant as never)) {
    return headerVariant as ExperimentVariant;
  }

  return (
    parseAssignment(cookieStore.get(SUBSCRIBE_CAPTURE_COOKIE_NAME)?.value)
      ?.variant ?? null
  );
}
