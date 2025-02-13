import * as Sentry from "@sentry/nextjs";

if (!!process.env.PUBLIC_FRONTEND_SENTRY_DSN) {
  Sentry.init({
    environment: process.env.METACULUS_ENV,
    dsn: process.env.PUBLIC_FRONTEND_SENTRY_DSN,
    tracesSampleRate: 0.1,
    ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
  });
}
