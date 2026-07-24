import "server-only";

import { PostHog } from "posthog-node";

import { getPublicSettings } from "./public_settings.server";

let posthogClient: PostHog | null = null;

// Kept free of next/headers so it is importable from proxy.ts (middleware)
function getPostHogServerClient(): PostHog | null {
  const { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_BASE_URL } = getPublicSettings();
  if (!PUBLIC_POSTHOG_KEY) return null;

  if (!posthogClient) {
    posthogClient = new PostHog(PUBLIC_POSTHOG_KEY, {
      host: PUBLIC_POSTHOG_BASE_URL || "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
      featureFlagsRequestTimeoutMs: 1500,
    });
  }
  return posthogClient;
}

export async function getFeatureFlagVariantForDistinctId(
  flagKey: string,
  distinctId: string
): Promise<string | null> {
  const client = getPostHogServerClient();
  if (!client) return null;

  try {
    // Exposure ($feature_flag_called) is captured client-side with the same
    // distinct_id, so suppress the server-side event here
    const variant = await client.getFeatureFlag(flagKey, distinctId, {
      sendFeatureFlagEvents: false,
    });
    return typeof variant === "string" ? variant : null;
  } catch {
    return null;
  }
}
