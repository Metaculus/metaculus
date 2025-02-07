import * as Sentry from "@sentry/nextjs";

if (!!process.env.PUBLIC_SENTRY_DSN) {
  Sentry.init({
    dsn: process.env.PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
  });
}
