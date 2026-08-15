import type { CaptureTrigger } from "@/types/gated_actions";

export const EMAIL_LINK_CONFIRMED_EVENT = "emailLinkConfirmed";

/**
 * Tags a redirect URL so EmailLinkEventToast greets the user on arrival, and
 * carries which deferred action was applied. The action has to travel in the
 * URL because the device-local pending record is cleared the moment the user
 * is signed in, before the destination page mounts.
 *
 * `url` must be a relative path (callers sanitize before calling). The URL API
 * keeps the query ahead of any #fragment, so anchors survive.
 */
export function withConfirmedEvent(
  url: string,
  appliedTrigger?: CaptureTrigger | null
): string {
  const parsed = new URL(url || "/", window.location.origin);
  parsed.searchParams.set("event", EMAIL_LINK_CONFIRMED_EVENT);
  if (appliedTrigger) {
    parsed.searchParams.set("applied", appliedTrigger);
  }
  return `${parsed.pathname}${parsed.search}${parsed.hash}`;
}
