import * as Sentry from "@sentry/nextjs";

import { getPublicSetting } from "@/components/public_settings_script";
import { buildSentryOptions } from "@/sentry/options";

const sentryDsn = getPublicSetting("PUBLIC_FRONTEND_SENTRY_DSN");
if (!!sentryDsn) {
  Sentry.init(buildSentryOptions(sentryDsn));
}

// This export will instrument router navigations, and is only relevant if you enable tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
