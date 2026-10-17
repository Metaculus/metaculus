import { safeDocumentCookie } from "@/utils/core/storage";

// __Host- prefix: browsers reject the cookie unless it is Secure, host-only and
// Path=/, which protects the double-submit check from subdomain cookie-tossing.
export const CSRF_COOKIE_NAME = "__Host-_csrf";

const CSRF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readCsrfToken(): string | null {
  return safeDocumentCookie.get(CSRF_COOKIE_NAME);
}

function writeCsrfToken(token: string): void {
  safeDocumentCookie.set(CSRF_COOKIE_NAME, token, {
    secure: true,
    maxAge: CSRF_COOKIE_MAX_AGE_SECONDS,
  });
}

// Not crypto.randomUUID: that one only exists in secure contexts, so it throws
// on http://<lan-ip> dev sessions. getRandomValues carries no such restriction.
function randomToken(): string {
  const bytes = new Uint8Array(16);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => b.toString(16).padStart(2, "0")).join("");
}

/**
 * Read the CSRF cookie, minting one only if absent. Client-side only. Called
 * when an OAuth flow starts, so the nonce embedded in `state` matches the
 * cookie the callback request will carry — unlike a render-time snapshot, which
 * can go stale while the page stays open. Reusing an existing token keeps
 * concurrent tabs in agreement rather than clobbering each other's nonce.
 */
export function getOrMintCsrfToken(): string {
  const existing = readCsrfToken();
  if (existing) return existing;

  const token = randomToken();
  writeCsrfToken(token);
  return token;
}

/**
 * Replace the CSRF cookie with a fresh value. Called after a successful OAuth
 * exchange to invalidate the nonce that just traveled through `state` (and into
 * request logs), bounding its usefulness to the duration of the flow.
 */
export function rotateCsrfToken(): void {
  writeCsrfToken(randomToken());
}

export function assertValidCsrfNonce(
  cookieToken: string | null | undefined,
  nonce: string
): void {
  if (!cookieToken) {
    throw new Error("Invalid CSRF token: cookie missing");
  }
  if (cookieToken !== nonce) {
    throw new Error("Invalid CSRF token: mismatch");
  }
}
