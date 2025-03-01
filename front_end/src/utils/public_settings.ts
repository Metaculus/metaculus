export interface PublicSettings {
  PUBLIC_MINIMAL_UI: boolean;
  PUBLIC_TURNSTILE_SITE_KEY: string;
  PUBLIC_APP_URL: string;
  PUBLIC_API_BASE_URL: string;
  PUBLIC_POSTHOG_KEY: string;
  PUBLIC_POSTHOG_BASE_URL: string;
  PUBLIC_FRONTEND_SENTRY_DSN: string;
  PUBLIC_GOOGLE_MEASUREMENT_ID: string;
  PUBLIC_DISALLOW_ALL_BOTS: boolean;
  PUBLIC_ALLOW_TUTORIAL: boolean;
  PUBLIC_ALLOW_SIGNUP: boolean;
  PUBLIC_LANDING_PAGE_URL: string;
  PUBLIC_AUTHENTICATION_REQUIRED: boolean;
  PUBLIC_SCREENSHOT_SERVICE_ENABLED: boolean;
}

export const defaultPublicSettingsValues: PublicSettings = {
  PUBLIC_MINIMAL_UI: false,
  PUBLIC_TURNSTILE_SITE_KEY: "",
  PUBLIC_APP_URL: "http://localhost:3000",
  PUBLIC_API_BASE_URL: "http://localhost:8000",
  PUBLIC_POSTHOG_KEY: "",
  PUBLIC_POSTHOG_BASE_URL: "https://us.i.posthog.com",
  PUBLIC_FRONTEND_SENTRY_DSN: "",
  PUBLIC_GOOGLE_MEASUREMENT_ID: "",
  PUBLIC_DISALLOW_ALL_BOTS: false,
  PUBLIC_ALLOW_TUTORIAL: true,
  PUBLIC_ALLOW_SIGNUP: true,
  PUBLIC_LANDING_PAGE_URL: "/",
  PUBLIC_AUTHENTICATION_REQUIRED: false,
  PUBLIC_SCREENSHOT_SERVICE_ENABLED: false,
};
