/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.metaculus.com/"}
 */
import {
  assertValidCsrfNonce,
  CSRF_COOKIE_NAME,
  rotateAndGetCsrfToken,
} from "../csrf";

describe("rotateAndGetCsrfToken", () => {
  beforeEach(() => {
    document.cookie = `${CSRF_COOKIE_NAME}=; Path=/; Secure; Max-Age=0`;
  });

  it("mints a token and persists it as a cookie when none exists", () => {
    const token = rotateAndGetCsrfToken();

    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/);
    expect(document.cookie).toContain(`${CSRF_COOKIE_NAME}=${token}`);
  });

  it("returns the new token instead of returning a previous one", () => {
    const first = rotateAndGetCsrfToken();

    expect(rotateAndGetCsrfToken()).not.toBe(first);
  });
});

describe("assertValidCsrfNonce", () => {
  it("passes when the nonce matches the cookie token", () => {
    expect(() => assertValidCsrfNonce("token-a", "token-a")).not.toThrow();
  });

  it("reports a missing cookie distinctly", () => {
    expect(() => assertValidCsrfNonce(null, "token-a")).toThrow(
      "Invalid CSRF token: cookie missing"
    );
    expect(() => assertValidCsrfNonce(undefined, "token-a")).toThrow(
      "Invalid CSRF token: cookie missing"
    );
  });

  it("reports a mismatch distinctly", () => {
    expect(() => assertValidCsrfNonce("token-a", "token-b")).toThrow(
      "Invalid CSRF token: mismatch"
    );
    expect(() => assertValidCsrfNonce("token-a", "")).toThrow(
      "Invalid CSRF token: mismatch"
    );
  });
});
