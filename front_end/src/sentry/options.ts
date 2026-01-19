import type {
  BrowserOptions,
  NodeOptions,
  VercelEdgeOptions,
} from "@sentry/nextjs";

import {
  beforeSentryAlertSend,
  SENTRY_DENY_URLS,
  SENTRY_IGNORE_ERRORS,
} from "@/utils/core/errors";

export function buildSentryOptions<
  T extends BrowserOptions | NodeOptions | VercelEdgeOptions,
>(dsn?: string): T {
  return {
    environment: process.env.METACULUS_ENV,
    dsn,
    tracesSampler: (ctx) => {
      const name = ctx.name;

      // We want to limit app-version and middleware traces
      // since they’re not informative, don’t involve complex logic,
      // and currently account for up to 50% of all frontend transactions
      if (name.startsWith("middleware ") || name.includes("/app-version")) {
        return 0.01;
      }

      return 0.1;
    },
    ignoreErrors: SENTRY_IGNORE_ERRORS,
    denyUrls: SENTRY_DENY_URLS,
    beforeSend: beforeSentryAlertSend,
  } as T;
}
