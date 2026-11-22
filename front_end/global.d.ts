import { RowData } from "@tanstack/table-core";
import type { TestingLibraryMatchers } from "@testing-library/jest-dom/matchers";
import type { expect } from "bun:test";

import en from "./messages/en.json";

import "@tanstack/react-table";

declare module "next-intl" {
  interface AppConfig {
    Messages: typeof en;
  }
}

declare module "@tanstack/table-core" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}

declare module "bun:test" {
  interface Matchers<T>
    extends TestingLibraryMatchers<
      ReturnType<typeof expect.stringContaining>,
      T
    > {}
}
