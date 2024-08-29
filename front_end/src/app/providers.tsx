"use client";
import posthog from "posthog-js";
import { PostHogProvider } from "posthog-js/react";

export function CSPostHogProvider({ children }: { children: any }) {
  console.log(process.env.NEXT_PUBLIC_POSTHOG_HOST);
  if (process.env.NEXT_PUBLIC_POSTHOG_KEY) {
    posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
      api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
      // set to 'always' to create profiles for anonymous users as well
      person_profiles: "identified_only",
    });
  }
  return <PostHogProvider client={posthog}>{children}</PostHogProvider>;
}
