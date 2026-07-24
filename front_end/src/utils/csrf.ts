// __Host- prefix: browsers reject the cookie unless it is Secure, host-only and
// Path=/, which protects the double-submit check from subdomain cookie-tossing.
export const CSRF_COOKIE_NAME = "__Host-_csrf";

const CSRF_COOKIE_MAX_AGE_SECONDS = 60 * 60 * 24 * 365;

/**
 * Rotates and returns the CSRF cookie. Client-side only. Called at the
 * moment an OAuth flow starts, so the nonce embedded in `state` always matches
 * the cookie the callback request will carry — unlike a render-time snapshot,
 * which can go stale while the page stays open.
 */
export function rotateAndGetCsrfToken(): string {
  const token = crypto.randomUUID();
  document.cookie = `${CSRF_COOKIE_NAME}=${token}; Path=/; Secure; SameSite=Lax; Max-Age=${CSRF_COOKIE_MAX_AGE_SECONDS}`;
  return token;
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
