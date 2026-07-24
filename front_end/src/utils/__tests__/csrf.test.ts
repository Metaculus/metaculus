/**
 * @jest-environment jsdom
 * @jest-environment-options {"url": "https://www.metaculus.com/"}
 */
import {
  assertValidCsrfNonce,
  CSRF_COOKIE_NAME,
  getOrMintCsrfToken,
  rotateCsrfToken,
} from "../csrf";

describe("getOrMintCsrfToken", () => {
  beforeEach(() => {
    document.cookie = `${CSRF_COOKIE_NAME}=; Path=/; Secure; Max-Age=0`;
  });

  it("mints a token and persists it as a cookie when none exists", () => {
    const token = getOrMintCsrfToken();

    expect(token).toMatch(/^[0-9a-f]{8}-[0-9a-f-]{27}$/);
    expect(document.cookie).toContain(`${CSRF_COOKIE_NAME}=${token}`);
  });

  it("returns the existing token instead of minting a new one", () => {
    const first = getOrMintCsrfToken();

    expect(getOrMintCsrfToken()).toBe(first);
  });
});

describe("rotateCsrfToken", () => {
  beforeEach(() => {
    document.cookie = `${CSRF_COOKIE_NAME}=; Path=/; Secure; Max-Age=0`;
  });

  it("replaces an existing token with a different persisted value", () => {
    const original = getOrMintCsrfToken();

    rotateCsrfToken();

    expect(getOrMintCsrfToken()).not.toBe(original);
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
