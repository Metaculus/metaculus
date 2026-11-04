import { getAnalyticsCookieConsentGiven } from "@/app/(main)/components/cookies_banner";

const TRACKED_PATHS = new Set([
  "/services",
  "/services/private-instances",
  "/services/tournaments",
  "/services/pro-forecasters",
]);

type RedditPixel = NonNullable<Window["rdt"]> & {
  callQueue: [string, string?, Record<string, unknown>?][];
  sendEvent?: NonNullable<Window["rdt"]>;
};

const initializedPixelIds = new Set<string>();

export const ANALYTICS_CONSENT_CHANGED = "analytics-consent-changed";

export function isTrackedServicesPath(pathname: string): boolean {
  return TRACKED_PATHS.has(pathname.replace(/\/$/, ""));
}

function initializeRedditPixel(pixelId: string): void {
  if (initializedPixelIds.has(pixelId)) return;

  if (window.rdt) {
    window.rdt("init", pixelId);
    initializedPixelIds.add(pixelId);
    return;
  }

  const pixel = function (
    ...args: [string, string?, Record<string, unknown>?]
  ) {
    if (pixel.sendEvent) {
      pixel.sendEvent(...args);
    } else {
      pixel.callQueue.push(args);
    }
  } as RedditPixel;

  pixel.callQueue = [];
  window.rdt = pixel;

  const script = document.createElement("script");
  script.src = `https://www.redditstatic.com/ads/pixel.js?pixel_id=${pixelId}`;
  script.async = true;
  document.head.appendChild(script);

  pixel("init", pixelId);
  initializedPixelIds.add(pixelId);
}

function trackRedditEvent(
  pixelId: string,
  event: string,
  data?: Record<string, unknown>
): void {
  if (
    typeof window === "undefined" ||
    !pixelId ||
    !isTrackedServicesPath(window.location.pathname) ||
    getAnalyticsCookieConsentGiven() !== "yes"
  ) {
    return;
  }

  initializeRedditPixel(pixelId);
  window.rdt?.("track", event, data);
}

export function trackServicesPageVisit(pixelId: string): void {
  trackRedditEvent(pixelId, "PageVisit");
}

export function trackServicesContactClick(pixelId: string): void {
  trackRedditEvent(pixelId, "Custom", {
    customEventName: "ServicesContactUsClick",
  });
}

export function trackServicesLead(pixelId: string): void {
  trackRedditEvent(pixelId, "Lead");
}
