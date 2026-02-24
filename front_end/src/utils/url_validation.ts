import dns from "dns";
import { isIP } from "net";
import { Agent, fetch as undiciFetch } from "undici";

const PRIVATE_IPV4_RANGES = [
  /^127\./, // Loopback
  /^10\./, // Private class A
  /^172\.(1[6-9]|2\d|3[01])\./, // Private class B
  /^192\.168\./, // Private class C
  /^169\.254\./, // Link-local
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./, // CGNAT
  /^0\./, // Unspecified
];

const PRIVATE_IPV6_RANGES = [
  /^::1$/, // Loopback
  /^fe[89ab][0-9a-f]:/i, // Link-local (fe80::/10)
  /^fc/i, // Unique local (fc00::/7)
  /^fd/i, // Unique local (fc00::/7)
  /^::$/, // Unspecified
];

const MAX_REDIRECTS = 3;
const PER_HOP_TIMEOUT_MS = 5000;

function extractMappedIPv4(ip: string): string | null {
  // Matches ::ffff:a.b.c.d (dotted-quad form)
  const dottedMatch = ip.match(
    /^::ffff:(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})$/i
  );
  if (dottedMatch?.[1]) return dottedMatch[1];

  // Matches ::ffff:XXYY:ZZWW (hex form, e.g. ::ffff:7f00:1)
  const hexMatch = ip.match(/^::ffff:([0-9a-f]{1,4}):([0-9a-f]{1,4})$/i);
  if (hexMatch?.[1] && hexMatch[2]) {
    const hi = parseInt(hexMatch[1], 16);
    const lo = parseInt(hexMatch[2], 16);
    return `${(hi >> 8) & 0xff}.${hi & 0xff}.${(lo >> 8) & 0xff}.${lo & 0xff}`;
  }

  return null;
}

function isPrivateIP(ip: string): boolean {
  const mappedV4 = extractMappedIPv4(ip);
  if (mappedV4) {
    return PRIVATE_IPV4_RANGES.some((range) => range.test(mappedV4));
  }

  if (isIP(ip) === 4) {
    return PRIVATE_IPV4_RANGES.some((range) => range.test(ip));
  }

  return PRIVATE_IPV6_RANGES.some((range) => range.test(ip));
}

function rejectPrivateIP(address: string): void {
  if (isPrivateIP(address)) {
    throw Object.assign(new Error("DNS resolved to a private IP"), {
      code: "ENOTFOUND",
    });
  }
}

// DNS lookup that rejects private IPs at resolution time — no TOCTOU gap.
// Handles both single and all-results forms (Node.js agents pass { all: true }).
function ssrfSafeLookup(
  hostname: string,
  options: dns.LookupOptions,
  callback: (...args: unknown[]) => void
): void {
  dns.lookup(
    hostname,
    options,
    (
      err: NodeJS.ErrnoException | null,
      addressOrArray: string | dns.LookupAddress[],
      family?: number
    ) => {
      if (err) {
        return callback(
          err,
          options.all ? [] : "",
          options.all ? undefined : 4
        );
      }

      try {
        if (options.all && Array.isArray(addressOrArray)) {
          for (const entry of addressOrArray) {
            rejectPrivateIP(entry.address);
          }
          return callback(null, addressOrArray);
        }

        rejectPrivateIP(addressOrArray as string);
        callback(null, addressOrArray, family);
      } catch (e) {
        callback(e, options.all ? [] : "", options.all ? undefined : 4);
      }
    }
  );
}

const ssrfSafeDispatcher = new Agent({
  connect: { lookup: ssrfSafeLookup as never, timeout: 10_000 },
  bodyTimeout: 15_000,
  headersTimeout: 10_000,
  keepAliveTimeout: 5_000,
  keepAliveMaxTimeout: 10_000,
});

function validateUrl(url: string): URL {
  const parsed = new URL(url);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  if (parsed.username || parsed.password) {
    throw new Error("URLs with embedded credentials are not allowed");
  }

  const port = parsed.port
    ? parseInt(parsed.port, 10)
    : parsed.protocol === "https:"
      ? 443
      : 80;
  if (Number.isNaN(port) || (port !== 80 && port !== 443)) {
    throw new Error("Only standard HTTP/HTTPS ports are allowed");
  }

  const hostname = parsed.hostname;
  const lowerHost = hostname.toLowerCase();
  if (
    lowerHost === "localhost" ||
    lowerHost === "127.0.0.1" ||
    lowerHost.endsWith(".localhost") ||
    lowerHost.endsWith(".local") ||
    lowerHost.endsWith(".internal") ||
    lowerHost.endsWith(".intranet") ||
    lowerHost.endsWith(".home") ||
    lowerHost.endsWith(".corp") ||
    lowerHost.endsWith(".test") ||
    lowerHost.endsWith(".example") ||
    lowerHost.endsWith(".invalid")
  ) {
    throw new Error("URLs pointing to internal hostnames are not allowed");
  }

  if (!lowerHost.includes(".")) {
    throw new Error("URLs must use a fully-qualified domain name");
  }

  if (isIP(hostname) && isPrivateIP(hostname)) {
    throw new Error("URLs pointing to private IPs are not allowed");
  }

  return parsed;
}

/**
 * SSRF-safe fetch. Uses a custom undici dispatcher whose DNS lookup
 * rejects private IPs atomically during connection — no TOCTOU gap.
 */
export function safeFetch(
  url: string,
  options: RequestInit = {}
): Promise<Response> {
  validateUrl(url);

  return undiciFetch(url, {
    ...(options as Record<string, unknown>),
    dispatcher: ssrfSafeDispatcher,
  }) as unknown as Promise<Response>;
}

/**
 * Validates that a URL is safe to fetch server-side (SSRF protection).
 * Checks protocol, hostname blocklist, resolves DNS to reject private IPs,
 * and follows redirects — validating each hop. Returns the final URL.
 */
export async function validateExternalUrl(url: string): Promise<string> {
  validateUrl(url);

  let current = url;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), PER_HOP_TIMEOUT_MS);
    let response: Response;
    try {
      response = await safeFetch(current, {
        method: "HEAD",
        redirect: "manual",
        signal: controller.signal,
      });
    } catch (err) {
      const cause =
        err instanceof Error && err.cause instanceof Error
          ? err.cause.message
          : "";
      const message = err instanceof Error ? err.message : "unknown";
      throw new Error(`Redirect hop failed: ${message} ${cause}`);
    } finally {
      clearTimeout(timer);
    }

    const location = response.headers.get("location");
    if (!location || response.status < 300 || response.status >= 400) {
      return current;
    }

    const next = new URL(location, current).toString();
    validateUrl(next);
    current = next;
  }
  throw new Error("Too many redirects");
}
