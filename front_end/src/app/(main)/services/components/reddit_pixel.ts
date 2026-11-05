import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";

const TRACKED_PATHS = new Set([
  "/services",
  "/services/private-instances",
  "/services/tournaments",
  "/services/pro-forecasters",
]);

export const ANALYTICS_CONSENT_CHANGED = "analytics-consent-changed";

export function isTrackedServicesPath(pathname: string): boolean {
  return TRACKED_PATHS.has(pathname.replace(/\/$/, ""));
}

function trackRedditEvent(event: string, data?: Record<string, unknown>): void {
  if (
    typeof window === "undefined" ||
    !isTrackedServicesPath(window.location.pathname) ||
    getAnalyticsCookieConsentGiven() !== "yes"
  ) {
    return;
  }

  window.rdt?.("track", event, data);
}

export function trackServicesPageVisit(): void {
  trackRedditEvent("PageVisit");
}

export function trackServicesContactClick(): void {
  trackRedditEvent("Custom", {
    customEventName: "ServicesContactUsClick",
  });
}

export function trackServicesLead(): void {
  trackRedditEvent("Lead");
}
