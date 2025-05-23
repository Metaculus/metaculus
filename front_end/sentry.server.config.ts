import * as Sentry from "@sentry/nextjs";

import {
  beforeSentryAlertSend,
  SENTRY_IGNORE_ERRORS,
} from "@/utils/core/errors";

if (!!process.env.PUBLIC_FRONTEND_SENTRY_DSN) {
  Sentry.init({
    environment: process.env.METACULUS_ENV,
    dsn: process.env.PUBLIC_FRONTEND_SENTRY_DSN,
    tracesSampleRate: 0.1,
    ignoreErrors: SENTRY_IGNORE_ERRORS,
    beforeSend: beforeSentryAlertSend,
  });
}
