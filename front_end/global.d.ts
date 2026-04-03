import { RowData } from "@tanstack/table-core";

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
