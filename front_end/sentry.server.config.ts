import * as Sentry from "@sentry/nextjs";

Sentry.init({
  dsn: process.env.NEXT_PUBLIC_SENTRY_DNS,
  tracesSampleRate: 0.1,
  ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
});
