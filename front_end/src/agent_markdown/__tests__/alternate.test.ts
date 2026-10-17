import { getMarkdownAlternateTypes } from "../respond";

describe("getMarkdownAlternateTypes", () => {
  const originalEnv = process.env;

  afterEach(() => {
    process.env = originalEnv;
  });

  it("points text/markdown at the absolute page URL", () => {
    process.env = {
      ...originalEnv,
      PUBLIC_APP_URL: "https://www.metaculus.com",
      PUBLIC_AUTHENTICATION_REQUIRED: "false",
    };

    expect(getMarkdownAlternateTypes("/notebooks/1/slug/")).toEqual({
      "text/markdown": "https://www.metaculus.com/notebooks/1/slug/",
    });
  });

  it("omits the alternate when markdown is gated", () => {
    process.env = {
      ...originalEnv,
      PUBLIC_APP_URL: "https://www.metaculus.com",
      PUBLIC_AUTHENTICATION_REQUIRED: "true",
    };

    expect(getMarkdownAlternateTypes("/notebooks/1/slug/")).toBeUndefined();
  });
});
