import * as Sentry from "@sentry/nextjs";

/**
 * Receives CSP violation reports (see buildCsp in @/utils/csp).
 * Accepts both the legacy report-uri format (application/csp-report) and the
 * Reporting API format (application/reports+json).
 */

// The endpoint is necessarily unauthenticated (browsers POST reports
// anonymously), so both the request and its content are attacker-controlled.
// Bound everything: body size, reports per request, bytes forwarded to Sentry.
const REPORT_CONTENT_TYPES = [
  "application/csp-report",
  "application/reports+json",
];
const MAX_BODY_BYTES = 64 * 1024;
const MAX_REPORTS_PER_REQUEST = 20;
const MAX_FORWARDED_REPORT_CHARS = 4096;

// Bound CSP report forwarding to protect Sentry quota. Dedupe is keyed by
// (effective directive, blocked origin), with a per-process global cap.
const DEDUPE_WINDOW_MS = 5 * 60_000;
const GLOBAL_WINDOW_MS = 60_000;
const MAX_FORWARDED_PER_WINDOW = 30;
const MAX_TRACKED_KEYS = 1000;

type SeenEntry = { windowStart: number; suppressed: number };
const seenViolations = new Map<string, SeenEntry>();

let globalWindowStart = 0;
let forwardedInWindow = 0;

/**
 * Returns whether this violation should be forwarded to Sentry, and how many
 * identical ones were suppressed since it was last forwarded.
 */
function shouldForward(
  key: string,
  now: number
): { forward: boolean; suppressed: number } {
  if (now - globalWindowStart >= GLOBAL_WINDOW_MS) {
    globalWindowStart = now;
    forwardedInWindow = 0;
  }
  if (forwardedInWindow >= MAX_FORWARDED_PER_WINDOW) {
    return { forward: false, suppressed: 0 };
  }

  const entry = seenViolations.get(key);
  if (entry && now - entry.windowStart < DEDUPE_WINDOW_MS) {
    entry.suppressed += 1;
    return { forward: false, suppressed: 0 };
  }

  if (seenViolations.size >= MAX_TRACKED_KEYS) {
    for (const [k, v] of seenViolations) {
      if (now - v.windowStart >= DEDUPE_WINDOW_MS) {
        seenViolations.delete(k);
      }
    }
    if (seenViolations.size >= MAX_TRACKED_KEYS) {
      seenViolations.clear();
    }
  }

  seenViolations.set(key, { windowStart: now, suppressed: 0 });
  forwardedInWindow += 1;
  return { forward: true, suppressed: entry?.suppressed ?? 0 };
}

// Scripts injected by browser extensions violate the policy but are not
// actionable - drop them to keep Sentry noise-free
const IGNORED_SCHEMES = [
  "chrome-extension",
  "moz-extension",
  "safari-extension",
  "safari-web-extension",
  "ms-browser-extension",
];

type CspViolation = {
  directive: string;
  blockedUri: string;
  documentUri: string;
  sourceFile: string;
  raw: Record<string, unknown>;
};

function asRecord(value: unknown): Record<string, unknown> | null {
  return typeof value === "object" && value !== null
    ? (value as Record<string, unknown>)
    : null;
}

function str(value: unknown): string {
  return typeof value === "string" ? value : "";
}

/**
 * Reads the request body, enforcing MAX_BODY_BYTES. Returns null when the
 * body is missing or oversized.
 */
async function readBodyCapped(request: Request): Promise<string | null> {
  // Fast reject on the header when present; it may legitimately be absent
  // (proxies re-encoding H2 bodies as chunked), so its absence is fine -
  // the capped stream read below is the actual enforcement
  const contentLengthHeader = request.headers.get("content-length");
  if (contentLengthHeader) {
    const contentLength = Number(contentLengthHeader);
    if (!Number.isFinite(contentLength) || contentLength > MAX_BODY_BYTES) {
      return null;
    }
  }

  // Content-Length can be understated by a hostile client, so enforce the
  // cap while reading regardless
  const reader = request.body?.getReader();
  if (!reader) return null;

  const chunks: Uint8Array[] = [];
  let received = 0;
  for (;;) {
    const { done, value } = await reader.read();
    if (done) break;
    received += value.byteLength;
    if (received > MAX_BODY_BYTES) {
      await reader.cancel();
      return null;
    }
    chunks.push(value);
  }
  return Buffer.concat(chunks).toString("utf8");
}

function normalizeReports(payload: unknown): CspViolation[] {
  // Reporting API: [{ type: "csp-violation", body: {...} }, ...]
  if (Array.isArray(payload)) {
    return payload.slice(0, MAX_REPORTS_PER_REQUEST).flatMap((report) => {
      const record = asRecord(report);
      const body = asRecord(record?.body);
      if (record?.type !== "csp-violation" || !body) return [];
      return [
        {
          directive: str(body.effectiveDirective),
          blockedUri: str(body.blockedURL),
          documentUri: str(body.documentURL),
          sourceFile: str(body.sourceFile),
          raw: body,
        },
      ];
    });
  }

  // Legacy report-uri: { "csp-report": {...} }
  const body = asRecord(asRecord(payload)?.["csp-report"]);
  if (!body) return [];
  return [
    {
      directive: str(body["effective-directive"] || body["violated-directive"]),
      blockedUri: str(body["blocked-uri"]),
      documentUri: str(body["document-uri"]),
      sourceFile: str(body["source-file"]),
      raw: body,
    },
  ];
}

function isExtensionNoise(violation: CspViolation): boolean {
  return IGNORED_SCHEMES.some(
    (scheme) =>
      violation.blockedUri.startsWith(scheme) ||
      violation.sourceFile.startsWith(scheme)
  );
}

// Strip paths/queries so Sentry groups violations by origin instead of
// creating an issue per URL
function toOrigin(uri: string): string {
  try {
    return new URL(uri).origin;
  } catch {
    return uri; // keyword values: "inline", "eval", "data", ...
  }
}

export async function POST(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";
  if (!REPORT_CONTENT_TYPES.some((type) => contentType.includes(type))) {
    return new Response(null, { status: 415 });
  }

  const body = await readBodyCapped(request);
  if (body === null) {
    return new Response(null, { status: 413 });
  }

  let payload: unknown;
  try {
    payload = JSON.parse(body);
  } catch {
    return new Response(null, { status: 400 });
  }

  const now = Date.now();
  for (const violation of normalizeReports(payload)) {
    if (isExtensionNoise(violation)) continue;

    const blockedOrigin = toOrigin(violation.blockedUri);
    const { forward, suppressed } = shouldForward(
      `${violation.directive}|${blockedOrigin}`,
      now
    );
    if (!forward) continue;

    Sentry.captureMessage(
      `CSP violation: ${violation.directive} blocked ${blockedOrigin}`,
      {
        level: "warning",
        fingerprint: ["csp-violation", violation.directive, blockedOrigin],
        extra: {
          report: JSON.stringify(violation.raw).slice(
            0,
            MAX_FORWARDED_REPORT_CHARS
          ),
          suppressed_since_last_forward: suppressed,
        },
      }
    );
  }

  return new Response(null, { status: 204 });
}
