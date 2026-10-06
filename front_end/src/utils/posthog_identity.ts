import { CurrentUser } from "@/types/users";

export type PostHogIdentity = {
  distinctId: string;
  properties: {
    username: string;
    is_superuser: boolean;
    is_staff: boolean;
    locale?: string;
    language?: string;
  };
};

// Single source for the identity sent to posthog.identify(), shared by the
// PostHog provider (on SDK load) and the auth context (on login changes)
export function getPostHogIdentity(
  user: CurrentUser,
  locale?: string
): PostHogIdentity {
  const { id, username, is_superuser, is_staff, language } = user;
  return {
    distinctId: id.toString(),
    properties: {
      username,
      is_superuser,
      is_staff,
      locale,
      language: language || locale,
    },
  };
}
