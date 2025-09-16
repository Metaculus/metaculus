import { FC } from "react";

import { logError } from "@/utils/core/errors";

import RefreshButton from "./refresh_button";

export default function WithServerComponentErrorBoundary<P extends object>(
  Component: FC<P>
): FC<P> {
  const WrappedComponent = (async (props: P) => {
    try {
      return await Component(props);
    } catch (error: unknown) {
      const digest =
        typeof error === "object" &&
        error !== null &&
        "digest" in error &&
        typeof (error as { digest?: unknown }).digest === "string"
          ? (error as { digest?: string }).digest
          : undefined;

      if (digest === "DYNAMIC_SERVER_USAGE") throw error;
      if (
        digest === "NEXT_NOT_FOUND" ||
        digest === "NEXT_HTTP_ERROR_FALLBACK;404" ||
        digest === "NEXT_REDIRECT"
      ) {
        return null;
      }

      logError(error);
      if (error instanceof Error) {
        return (
          <div className="flex h-[50vh] w-full flex-col items-center justify-center">
            <h2>{error.message ?? digest ?? "Unknown error"}</h2>
            <RefreshButton />
          </div>
        );
      }

      return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center">
          <h2>Unknown error</h2>
          <RefreshButton />
        </div>
      );
    }
  }) as unknown as FC<P>;

  return WrappedComponent;
}
