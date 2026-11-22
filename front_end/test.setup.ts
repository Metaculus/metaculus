import * as matchers from "@testing-library/jest-dom/matchers";
import { cleanup } from "@testing-library/react";
import { afterEach, expect, jest, mock } from "bun:test";
import * as actualNavigation from "next/navigation";
import { useRouter as useMemoryRouter } from "next-router-mock";

expect.extend(matchers);

mock.module("server-only", () => ({}));

// Snapshot the real exports first: mock.module patches the live namespace in
// place, and ESM linking fails on any named export the mock leaves out.
const realNavigation = { ...actualNavigation };
mock.module("next/navigation", () => ({
  ...realNavigation,
  useRouter: jest.fn(useMemoryRouter),
  usePathname: jest.fn(() => useMemoryRouter().pathname),
  useSearchParams: jest.fn(
    () => new URLSearchParams(useMemoryRouter().query as Record<string, string>)
  ),
}));

afterEach(() => {
  cleanup();
  jest.clearAllMocks();
});
