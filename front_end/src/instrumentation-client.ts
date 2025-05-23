import * as Sentry from "@sentry/nextjs";

import { getPublicSetting } from "@/components/public_settings_script";
import {
  beforeSentryAlertSend,
  SENTRY_IGNORE_ERRORS,
} from "@/utils/core/errors";

const sentryDsn = getPublicSetting("PUBLIC_FRONTEND_SENTRY_DSN");
if (!!sentryDsn) {
  Sentry.init({
    environment: process.env.METACULUS_ENV,
    dsn: sentryDsn,
    tracesSampleRate: 0.1,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: SENTRY_IGNORE_ERRORS,
    beforeSend: beforeSentryAlertSend,
  });
}

// This export will instrument router navigations, and is only relevant if you enable tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
