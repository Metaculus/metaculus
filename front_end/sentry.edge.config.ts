import * as Sentry from "@sentry/nextjs";

import { buildSentryOptions } from "@/sentry/options";

if (!!process.env.PUBLIC_FRONTEND_SENTRY_DSN) {
  Sentry.init(buildSentryOptions(process.env.PUBLIC_FRONTEND_SENTRY_DSN));
}
