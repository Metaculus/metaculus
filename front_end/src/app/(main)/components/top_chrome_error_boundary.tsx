"use client";

import Link from "next/link";
import { ErrorBoundary } from "react-error-boundary";

import { logError } from "@/utils/core/errors";

type Props = {
  children: React.ReactNode;
  fallback?: React.ReactNode;
  name: string;
};

export const TopChromePartErrorBoundary = ({
  children,
  fallback = null,
  name,
}: Props) => {
  return (
    <ErrorBoundary
      fallback={fallback}
      onError={(error) => {
        logError(error, {
          message: `Failed to render top chrome ${name}`,
        });
      }}
    >
      {children}
    </ErrorBoundary>
  );
};

export const TopChromeFallbackHeader = () => {
  return (
    <header className="flex h-12 w-full flex-auto items-stretch justify-between bg-blue-900 text-gray-0 print:hidden">
      <Link
        href="/"
        className="inline-flex h-full max-w-60 flex-shrink-0 flex-grow-0 basis-auto flex-col justify-center text-center no-underline"
      >
        <h1 className="mx-3 my-0 font-league-gothic text-[28px] font-light tracking-widest !text-gray-0 antialiased">
          M
        </h1>
      </Link>
    </header>
  );
};
