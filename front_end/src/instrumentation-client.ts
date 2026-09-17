import * as Sentry from "@sentry/nextjs";

import { getPublicSetting } from "@/components/public_settings_script";
import { buildSentryOptions } from "@/sentry/options";

const sentryDsn = getPublicSetting("PUBLIC_FRONTEND_SENTRY_DSN");
if (!!sentryDsn) {
  Sentry.init({
    ...buildSentryOptions<Sentry.BrowserOptions>(sentryDsn),
    // Queue events the browser fails to deliver (offline, flaky network) in
    // IndexedDB and retry, incl. on next startup - the default fetch transport
    // makes a single attempt and drops the event
    transport: Sentry.makeBrowserOfflineTransport(Sentry.makeFetchTransport),
    // flushAtStartup is a BrowserOfflineTransportOptions field, which the
    // public transportOptions type doesn't include
    transportOptions: {
      flushAtStartup: true,
    } as Sentry.BrowserOptions["transportOptions"],
  });
}

// This export will instrument router navigations, and is only relevant if you enable tracing.
export const onRouterTransitionStart = Sentry.captureRouterTransitionStart;
