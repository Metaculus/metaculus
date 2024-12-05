import { RowData } from "@tanstack/table-core";

import en from "./messages/en.json";

import "@tanstack/react-table";

type Messages = typeof en;

declare global {
  // Use type safe message keys with `next-intl`
  interface IntlMessages extends Messages {}
}

declare module "@tanstack/table-core" {
  interface ColumnMeta<TData extends RowData, TValue> {
    className: string;
  }
}
