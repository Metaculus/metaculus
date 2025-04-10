import * as Sentry from "@sentry/nextjs";

import { getPublicSettings } from "@/utils/public_settings.server";

const { PUBLIC_FRONTEND_SENTRY_DSN } = getPublicSettings();

export function initSentry() {
  if (!!PUBLIC_FRONTEND_SENTRY_DSN) {
    Sentry.init({
      environment: process.env.METACULUS_ENV,
      dsn: PUBLIC_FRONTEND_SENTRY_DSN,
      tracesSampleRate: 0.075,
      replaysSessionSampleRate: 0.075,
      replaysOnErrorSampleRate: 1.0,
      ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
      integrations: [Sentry.replayIntegration()],
    });
  }
}
