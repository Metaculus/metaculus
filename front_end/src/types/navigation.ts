import { LinkProps } from "next/link";

export type SearchParams = Record<string, string | string[] | undefined>;

export type Href = LinkProps["href"];
