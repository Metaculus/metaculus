import dns from "dns/promises";
import { isIP } from "net";

const PRIVATE_IP_RANGES = [
  // Loopback
  /^127\./,
  // Private networks
  /^10\./,
  /^172\.(1[6-9]|2\d|3[01])\./,
  /^192\.168\./,
  // Link-local
  /^169\.254\./,
  // CGNAT
  /^100\.(6[4-9]|[7-9]\d|1[01]\d|12[0-7])\./,
  // IPv6-mapped IPv4 loopback/private
  /^::1$/,
  /^fe80:/i,
  /^fc00:/i,
  /^fd/i,
  // Unspecified
  /^0\./,
  /^::$/,
];

function isPrivateIP(ip: string): boolean {
  return PRIVATE_IP_RANGES.some((range) => range.test(ip));
}

/**
 * Validates that a URL is safe to fetch server-side (SSRF protection).
 * Throws an error if the URL is invalid, uses a non-HTTP(S) protocol,
 * or resolves to a private/internal IP address.
 */
export async function validateExternalUrl(url: string): Promise<void> {
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
