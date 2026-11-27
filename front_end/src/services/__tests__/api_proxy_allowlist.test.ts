import { describe, expect, it, mock } from "bun:test";
import { readdirSync, readFileSync } from "fs";
import { join } from "path";

import { isApiProxyPathAllowed } from "@/services/api_proxy_allowlist";

const requestedUrls: string[] = [];

mock.module("@/utils/core/fetch/fetch.client", () => {
  const record = (url: string) => {
    requestedUrls.push(url);
    return Promise.resolve({});
  };
  return {
    clientFetcher: {
      get: record,
      post: record,
      put: record,
      patch: record,
      del: record,
    },
  };
});

type ClientApi = Record<string, (...args: unknown[]) => unknown>;

const SRC_DIR = join(import.meta.dir, "..", "..");
const SOURCE_FILES = (readdirSync(SRC_DIR, { recursive: true }) as string[])
  .filter((file) => /\.tsx?$/.test(file) && !file.includes("__tests__"))
  .map((file) => join(SRC_DIR, file));

const CLIENT_API_MODULES = new Map<string, string>();
for (const file of SOURCE_FILES.filter((f) => f.endsWith(".client.ts"))) {
  const match = readFileSync(file, "utf8").match(
    /const (Client\w+Api) = new \w+\(clientFetcher\)/
  );
  if (match?.[1]) CLIENT_API_MODULES.set(match[1], file);
}

const CLIENT_API_CALLS = new Set<string>();
for (const file of SOURCE_FILES) {
  const text = readFileSync(file, "utf8");
  for (const [, api, method] of text.matchAll(/\b(Client\w+Api)\.(\w+)/g)) {
    CLIENT_API_CALLS.add(`${api}.${method}`);
  }
}

// Stands in for any argument: stringifies to "1", every property and call returns itself
const ANY_ARG: unknown = new Proxy(function () {}, {
  get: (_, key) => {
    if (key === Symbol.toPrimitive) return () => 1;
    if (key === "then") return undefined;
    return ANY_ARG;
  },
  apply: () => ANY_ARG,
});

describe("api-proxy allowlist", () => {
  it("discovers client API modules and calls", () => {
    expect(CLIENT_API_MODULES.size).toBeGreaterThan(0);
    expect(CLIENT_API_CALLS.size).toBeGreaterThan(0);
  });

  it.each([...CLIENT_API_CALLS].sort())(
    "%s requests an allowlisted path",
    async (call) => {
      const [api = "", method = ""] = call.split(".");
      const modulePath = CLIENT_API_MODULES.get(api);
      expect(modulePath).toBeDefined();

      const client = (await import(modulePath as string)).default as ClientApi;
      requestedUrls.length = 0;
      try {
        await client[method]?.(...Array(6).fill(ANY_ARG));
      } catch {}

      expect(requestedUrls.length).toBeGreaterThan(0);
      const blocked = requestedUrls.filter(
        (url) => !isApiProxyPathAllowed(new URL(url, "http://x").pathname)
      );
      expect(blocked).toEqual([]);
    }
  );

  it.each([
    "/users/me/",
    "/posts/1/download-data/",
    "/get-data-access-status/",
    "/data/download/",
  ])("rejects %s", (path) => {
    expect(isApiProxyPathAllowed(path)).toBe(false);
  });
});
