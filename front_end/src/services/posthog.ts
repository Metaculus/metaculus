import { PostHog } from "posthog-node";

export default function PostHogClient() {
  if (
    !process.env.PUBLIC_POSTHOG_KEY ||
    !process.env.PUBLIC_POSTHOG_BASE_URL
  ) {
    return null;
  }

  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const posthogClient = new PostHog(process.env.PUBLIC_POSTHOG_KEY!, {
    host: process.env.PUBLIC_POSTHOG_BASE_URL,
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}
