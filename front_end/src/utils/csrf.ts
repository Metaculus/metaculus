// __Host- prefix: browsers reject the cookie unless it is Secure, host-only and
// Path=/, which protects the double-submit check from subdomain cookie-tossing.
export const CSRF_COOKIE_NAME = "__Host-_csrf";

const CSRF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

function readCsrfToken(): string | null {
  return (
    document.cookie
      .split("; ")
      .find((cookie) => cookie.startsWith(`${CSRF_COOKIE_NAME}=`))
      ?.slice(CSRF_COOKIE_NAME.length + 1) ?? null
  );
}

function writeCsrfToken(token: string): void {
  document.cookie = `${CSRF_COOKIE_NAME}=${token}; Path=/; Secure; SameSite=Lax; Max-Age=${CSRF_COOKIE_MAX_AGE_SECONDS}`;
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

  const token = crypto.randomUUID();
  writeCsrfToken(token);
  return token;
}

/**
 * Replace the CSRF cookie with a fresh value. Called after a successful OAuth
 * exchange to invalidate the nonce that just traveled through `state` (and into
 * request logs), bounding its usefulness to the duration of the flow.
 */
export function rotateCsrfToken(): void {
  writeCsrfToken(crypto.randomUUID());
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
