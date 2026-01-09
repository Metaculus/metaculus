import "server-only";

import { cookies } from "next/headers";
import { PostHog } from "posthog-node";

import { getPublicSettings } from "./public_settings.server";

let posthogClient: PostHog | null = null;

function getPostHogClient(): PostHog | null {
  const { PUBLIC_POSTHOG_KEY, PUBLIC_POSTHOG_BASE_URL } = getPublicSettings();
  const apiKey = PUBLIC_POSTHOG_KEY;
  if (!apiKey) return null;

  if (!posthogClient) {
    posthogClient = new PostHog(apiKey, {
      host: PUBLIC_POSTHOG_BASE_URL || "https://us.i.posthog.com",
      flushAt: 1,
      flushInterval: 0,
    });
  }
  return posthogClient;
}

export async function getFeatureFlag(
  flagName: string,
  defaultValue: boolean | string = false
): Promise<boolean | string> {
  const client = getPostHogClient();
  if (!client) return defaultValue;

  const { PUBLIC_POSTHOG_KEY } = getPublicSettings();

  const cookieStore = await cookies();
  const cookieName = "ph_" + PUBLIC_POSTHOG_KEY + "_posthog";
  const cookieValue = cookieStore.get(cookieName)?.value;
  const distinctId = cookieValue
    ? JSON.parse(cookieValue).distinct_id
    : "anonymous";

  try {
    const flag = await client.getFeatureFlag(flagName, distinctId);

    return flag !== undefined ? flag : defaultValue;
  } catch {
    return defaultValue;
  }
}
