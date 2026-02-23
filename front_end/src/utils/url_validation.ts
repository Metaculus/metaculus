import dns from "dns/promises";
import { isIP } from "net";

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
  /^fe80:/i, // Link-local
  /^fc/i, // Unique local (fc00::/7)
  /^fd/i, // Unique local (fc00::/7)
  /^::$/, // Unspecified
];

const MAX_REDIRECTS = 5;

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

async function validateHostname(url: string): Promise<void> {
  const parsed = new URL(url);

  if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
    throw new Error("Only HTTP and HTTPS URLs are allowed");
  }

  const hostname = parsed.hostname;

  if (isIP(hostname)) {
    if (isPrivateIP(hostname)) {
      throw new Error("URLs pointing to private IPs are not allowed");
    }
    return;
  }

  const results = await dns.lookup(hostname, { all: true });
  for (const result of results) {
    if (isPrivateIP(result.address)) {
      throw new Error("URLs pointing to private IPs are not allowed");
    }
  }
}

/**
 * Validates that a URL is safe to fetch server-side (SSRF protection).
 * Checks protocol, resolves DNS to reject private IPs, and follows
 * redirects manually — validating each hop. Returns the final URL.
 */
export async function validateExternalUrl(url: string): Promise<string> {
  await validateHostname(url);

  let current = url;
  for (let i = 0; i < MAX_REDIRECTS; i++) {
    const response = await fetch(current, {
      method: "HEAD",
      redirect: "manual",
    });

    const location = response.headers.get("location");
    if (!location || response.status < 300 || response.status >= 400) {
      return current;
    }

    const next = new URL(location, current).toString();
    await validateHostname(next);
    current = next;
  }
  throw new Error("Too many redirects");
}
