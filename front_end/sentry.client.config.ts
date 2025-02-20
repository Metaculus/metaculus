import * as Sentry from "@sentry/nextjs";

if (!!process.env.PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
  });
}
