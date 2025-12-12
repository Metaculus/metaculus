import type { RelativeTimeElement } from "@github/relative-time-element";
import { HTMLAttributes, ReactNode } from "react";
import "@github/relative-time-element";

// Extend the native RelativeTimeElement properties for React
interface RelativeTimeProps
  extends HTMLAttributes<HTMLElement>,
    Partial<Omit<RelativeTimeElement, keyof HTMLElement>> {
  children?: ReactNode;
}

const RelativeTime = ({ children, ...props }: RelativeTimeProps) => {
  return (
    // @ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304
    <relative-time suppressHydrationWarning {...props}>
      {children}
      {/* @ts-expect-error relative-time-element lacks TS compatibility with React 19, tracked here: https://github.com/github/relative-time-element/issues/304 */}
    </relative-time>
  );
};

export default RelativeTime;
