import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DNS,
  tracesSampleRate: 1,
  integrations: [Sentry.replayIntegration()],
  replaysSessionSampleRate: 0.1,
  replaysOnErrorSampleRate: 1.0,
  ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
});
