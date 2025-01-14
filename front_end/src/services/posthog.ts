import { PostHog } from "posthog-node";

export default function PostHogClient() {
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const posthogClient = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_KEY!, {
    host: process.env.NEXT_PUBLIC_POSTHOG_BASE_URL,
    flushAt: 1,
    flushInterval: 0,
  });
  return posthogClient;
}
