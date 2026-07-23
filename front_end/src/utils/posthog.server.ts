import "server-only";

import { cookies } from "next/headers";

import { getPostHogServerClient } from "./posthog_node_client";
import { getPublicSettings } from "./public_settings.server";

export async function getFeatureFlag(
  flagName: string,
  defaultValue: boolean | string = false
): Promise<boolean | string> {
  const client = getPostHogServerClient();
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
