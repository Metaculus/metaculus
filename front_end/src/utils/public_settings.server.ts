import 'server-only'
import { defaultPublicSettingsValues } from './public_settings';

export function getPublicSettings() {
  const defVals = defaultPublicSettingsValues;

  return {
    PUBLIC_MINIMAL_UI:
      process.env.PUBLIC_MINIMAL_UI !== undefined
        ? process.env.PUBLIC_MINIMAL_UI.toLowerCase() === "true"
        : defVals.PUBLIC_MINIMAL_UI,
    PUBLIC_TURNSTILE_SITE_KEY: process.env.PUBLIC_TURNSTILE_SITE_KEY ?? "",
    PUBLIC_APP_URL: process.env.PUBLIC_APP_URL ?? defVals.PUBLIC_APP_URL,
    PUBLIC_API_BASE_URL:
      process.env.PUBLIC_API_BASE_URL ?? defVals.PUBLIC_API_BASE_URL,
    PUBLIC_POSTHOG_KEY: process.env.PUBLIC_POSTHOG_KEY ?? "",
    PUBLIC_POSTHOG_BASE_URL: process.env.PUBLIC_POSTHOG_BASE_URL ?? "",
    PUBLIC_SENTRY_DSN: process.env.PUBLIC_SENTRY_DSN ?? "",
    PUBLIC_GOOGLE_MEASUREMENT_ID:
      process.env.PUBLIC_GOOGLE_MEASUREMENT_ID ?? "",
    PUBLIC_DISALLOW_ALL_BOTS:
      process.env.PUBLIC_DISALLOW_ALL_BOTS !== undefined
        ? process.env.PUBLIC_DISALLOW_ALL_BOTS === "true"
        : defVals.PUBLIC_DISALLOW_ALL_BOTS,
    PUBLIC_LANDING_PAGE_URL:
      process.env.PUBLIC_LANDING_PAGE_URL ?? defVals.PUBLIC_LANDING_PAGE_URL,
    PUBLIC_ALLOW_TUTORIAL:
      process.env.PUBLIC_ALLOW_TUTORIAL !== undefined
        ? process.env.PUBLIC_ALLOW_TUTORIAL.toLowerCase() === "true"
        : defVals.PUBLIC_ALLOW_TUTORIAL,
    PUBLIC_ALLOW_SIGNUP:
      process.env.PUBLIC_ALLOW_SIGNUP !== undefined
        ? process.env.PUBLIC_ALLOW_SIGNUP === "true"
        : defVals.PUBLIC_ALLOW_SIGNUP,
  };
}
