import { ensureRelativeRedirect } from "../navigation";

describe("ensureRelativeRedirect", () => {
  it("returns root for empty input", () => {
    expect(ensureRelativeRedirect("")).toBe("/");
  });

  it("passes through a normal relative path", () => {
    expect(ensureRelativeRedirect("/questions/123/")).toBe("/questions/123/");
  });

  it("preserves query string and fragment", () => {
    expect(ensureRelativeRedirect("/questions/123/?tab=x#comment-1")).toBe(
      "/questions/123/?tab=x#comment-1"
    );
  });

  it("rejects protocol-relative URLs", () => {
    expect(() => ensureRelativeRedirect("//evil.com")).toThrow();
  });

  it("rejects absolute URLs", () => {
    expect(() => ensureRelativeRedirect("https://evil.com")).toThrow();
  });

  it("rejects javascript: URLs", () => {
    expect(() => ensureRelativeRedirect("javascript:alert(1)")).toThrow();
  });

  // Regression: the browser's URL parser normalizes backslashes to forward
  // slashes and strips tab/newline, so these must be rejected instead of
  // sailing past the guards and resolving to an external origin.
  it.each([
    "/\\evil.com",
    "\\\\evil.com",
    "/\\/\\evil.com",
    "/\t/evil.com",
    "/\n/evil.com",
  ])("rejects open-redirect bypass %j", (input) => {
    expect(() => ensureRelativeRedirect(input)).toThrow();
  });
});
