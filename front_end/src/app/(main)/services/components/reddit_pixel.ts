import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";

const TRACKED_PATHS = new Set([
  "/services",
  "/services/private-instances",
  "/services/tournaments",
  "/services/pro-forecasters",
]);

export const ANALYTICS_CONSENT_CHANGED = "analytics-consent-changed";
export const SERVICES_REDDIT_PAGE_VISIT = "services_reddit_page_visit";

export function isTrackedServicesPath(pathname: string): boolean {
  return TRACKED_PATHS.has(pathname.replace(/\/$/, ""));
}

function trackRedditEvent(
  event: string,
  data?: Record<string, unknown>,
  pathname?: string
): void {
  if (
    typeof window === "undefined" ||
    !isTrackedServicesPath(pathname ?? window.location.pathname) ||
    getAnalyticsCookieConsentGiven() !== "yes"
  ) {
    return;
  }

  if (window.rdt) {
    window.rdt("track", event, data);
    return;
  }

  let attempts = 0;
  const interval = window.setInterval(() => {
    if (getAnalyticsCookieConsentGiven() !== "yes" || attempts++ >= 100) {
      window.clearInterval(interval);
      return;
    }

    if (window.rdt) {
      window.clearInterval(interval);
      window.rdt("track", event, data);
    }
  }, 100);
}

export function trackServicesPageVisit(pathname: string): void {
  if (
    typeof window === "undefined" ||
    !isTrackedServicesPath(pathname) ||
    getAnalyticsCookieConsentGiven() !== "yes"
  ) {
    return;
  }

  window.dataLayer ??= [];
  window.dataLayer.push({ event: SERVICES_REDDIT_PAGE_VISIT });
}

export function trackServicesContactClick(): void {
  trackRedditEvent("Custom", {
    customEventName: "ServicesContactUsClick",
  });
}

export function trackServicesContactArrival(): void {
  trackRedditEvent("Custom", {
    customEventName: "ServicesContactUsDirectArrival",
  });
}

export function trackServicesLead(pathname: string): void {
  trackRedditEvent("Lead", undefined, pathname);
}
