import * as Sentry from "@sentry/nextjs";

import { getPublicSetting } from "@/components/public_settings_script";

const sentryDsn = getPublicSetting("PUBLIC_FRONTEND_SENTRY_DSN");
if (!!sentryDsn) {
  Sentry.init({
    environment: process.env.METACULUS_ENV,
    dsn: sentryDsn,
    tracesSampleRate: 0.1,
    integrations: [Sentry.replayIntegration()],
    replaysSessionSampleRate: 0.1,
    replaysOnErrorSampleRate: 1.0,
    ignoreErrors: ["NEXT_REDIRECT", "NEXT_NOT_FOUND"],
  });
}
