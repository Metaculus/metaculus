import { sendGAEvent } from "@next/third-parties/google";
import posthog from "posthog-js";

export function sendAnalyticsEvent(
  event: string,
  properties: Record<string, any>
) {
  posthog.capture(event, properties);
  sendGAEvent("event", event, properties);
}
