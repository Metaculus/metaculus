import type {
  BrowserOptions,
  NodeOptions,
  VercelEdgeOptions,
} from "@sentry/nextjs";

import {
  beforeSentryAlertSend,
  SENTRY_IGNORE_ERRORS,
} from "@/utils/core/errors";

export function buildSentryOptions<
  T extends BrowserOptions | NodeOptions | VercelEdgeOptions,
>(dsn?: string): T {
  return {
    environment: process.env.METACULUS_ENV,
    dsn,
    tracesSampler: (ctx) => {
      const name = ctx?.transactionContext?.name;
      const op = ctx?.transactionContext?.op;

      // We want to limit app-version and middleware traces
      // since they’re not informative, don’t involve complex logic,
      // and currently account for up to 50% of all frontend transactions
      if (
        name === "GET /front_end/src/app/(api)/app-version" ||
        op === "http.server.middleware"
      ) {
        return 0.01;
      }

      return 0.1;
    },
    ignoreErrors: SENTRY_IGNORE_ERRORS as (string | RegExp)[],
    beforeSend: beforeSentryAlertSend,
  } as T;
}
