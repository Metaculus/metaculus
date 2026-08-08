import "server-only";
import { NextResponse } from "next/server";

import { getPublicSettings } from "@/utils/public_settings.server";

export const CSP_REPORT_URI = "/csp-report/";

function getSentryHost(dsn: string): string | null {
  try {
    return new URL(dsn).host;
  } catch {
    return null;
  }
}

/**
 * Nonce-based strict CSP, currently deployed in Report-Only mode.
 *
 * 'unsafe-inline' and https: in script-src are fallbacks for old browsers
 * without nonce/strict-dynamic support; browsers that support nonces ignore
 * them.
 */
export function buildCsp(nonce: string): string {
  const { PUBLIC_POSTHOG_BASE_URL, PUBLIC_FRONTEND_SENTRY_DSN } =
    getPublicSettings();

  const sentryHost = getSentryHost(PUBLIC_FRONTEND_SENTRY_DSN);

  // Next dev needs WebSockets for HMR.
  const isDev = process.env.NODE_ENV !== "production";
  // Temporary: allow eval while existing eval-based forecast code is being replaced.
  const unsafeEval = " 'unsafe-eval'";

  const directives = [
    `default-src 'self'`,
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' 'unsafe-inline' https:${unsafeEval}`,
    // React style={{}} props and user-authored <style> tags in markdown
    // require 'unsafe-inline' (accepted tradeoff, script-src stays strict)
    `style-src 'self' 'unsafe-inline'`,
    // https: because user markdown supports <img> from arbitrary external
    // hosts (documented in /help/markdown/) - image injection is an accepted
    // low-risk tradeoff, script-src stays strict
    `img-src 'self' https: data: blob:`,
    // /cup page video hosted on the CDN
    `media-src 'self' https://cdn.metaculus.com`,
    `font-src 'self'`,
    [
      `connect-src 'self'`,
      isDev ? `ws: wss:` : "",
      PUBLIC_POSTHOG_BASE_URL,
      sentryHost ? `https://${sentryHost}` : `https://*.ingest.sentry.io`,
      `https://www.google-analytics.com https://*.google-analytics.com https://*.analytics.google.com https://www.google.com`,
      // marketing pixel beacons
      `https://www.facebook.com https://px.ads.linkedin.com https://pixel-config.reddit.com`,
    ]
      .filter(Boolean)
      .join(" "),
    [
      // www.metaculus.com - question embeds in markdown, cross-origin on
      // non-prod hosts; challenges.cloudflare.com - Turnstile captcha
      `frame-src 'self' https://www.metaculus.com https://challenges.cloudflare.com`,
      // documented markdown iframe allowlist (see /help/markdown/)
      `https://afdc.energy.gov https://data.worldbank.org https://finance.yahoo.com https://fred.stlouisfed.org https://ourworldindata.org https://www.eia.gov`,
    ].join(" "),
    `frame-ancestors 'self'`,
    `base-uri 'self'`,
    `form-action 'self'`,
    `object-src 'none'`,
    `report-uri ${CSP_REPORT_URI}`,
    `report-to csp-endpoint`,
  ];

  return directives.join("; ");
}

export function applyCspHeaders(response: NextResponse, csp: string): void {
  response.headers.set("Content-Security-Policy-Report-Only", csp);
  response.headers.set(
    "Reporting-Endpoints",
    `csp-endpoint="${CSP_REPORT_URI}"`
  );
}
