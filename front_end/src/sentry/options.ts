import type {
  BrowserOptions,
  NodeOptions,
  VercelEdgeOptions,
} from "@sentry/nextjs";

import { getPublicSetting } from "@/components/public_settings_script";
import {
  beforeSentryAlertSend,
  SENTRY_DENY_URLS,
  SENTRY_IGNORE_ERRORS,
} from "@/utils/core/errors";

export function buildSentryOptions<
  T extends BrowserOptions | NodeOptions | VercelEdgeOptions,
>(dsn?: string): T {
  return {
    environment:
      process.env.METACULUS_ENV || getPublicSetting("PUBLIC_METACULUS_ENV"),
    dsn,
    tracesSampler: (ctx) => {
      const name = ctx.name;

      // Completely exclude app-version health checks
      if (name.includes("/app-version")) {
        return 0;
      }

      // Heavily reduce middleware traces - low informational value
      if (name.startsWith("middleware ")) {
        return 0.005;
      }

      // Reduce api-proxy pass-through traces
      if (name.includes("/api-proxy/")) {
        return 0.05;
      }

      return 0.075;
    },
    ignoreErrors: SENTRY_IGNORE_ERRORS,
    denyUrls: SENTRY_DENY_URLS,
    beforeSend: beforeSentryAlertSend,
  } as T;
}
