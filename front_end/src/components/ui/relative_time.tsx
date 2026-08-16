import type { RelativeTimeElement } from "@github/relative-time-element";
import { HTMLAttributes, ReactNode } from "react";
import "@github/relative-time-element";

import { normalizeIntlLocale } from "@/utils/formatters/date";

// Extend the native RelativeTimeElement properties for React
interface RelativeTimeProps
  extends HTMLAttributes<HTMLElement>,
    Partial<Omit<RelativeTimeElement, keyof HTMLElement>> {
  children?: ReactNode;
}

const RelativeTime = ({ children, lang, ...props }: RelativeTimeProps) => {
  const normalizedLang = lang ? normalizeIntlLocale(lang) : lang;
  return (
    // @ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304
    <relative-time suppressHydrationWarning lang={normalizedLang} {...props}>
      {children}
      {/* @ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
    </relative-time>
  );
};

export default RelativeTime;
