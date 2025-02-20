import * as Sentry from "@sentry/nextjs";

if (!!process.env.PUBLIC_FRONTEND_SENTRY_DSN) {
  Sentry.init({
    environment: process.env.METACULUS_ENV,
    dsn: process.env.PUBLIC_FRONTEND_SENTRY_DSN,
    tracesSampleRate: 0.1,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
  });
}
