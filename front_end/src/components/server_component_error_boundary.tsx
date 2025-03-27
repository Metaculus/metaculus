import { FC } from "react";

import { logError } from "@/utils/errors";

import RefreshButton from "./refresh_button";

const WithServerComponentErrorBoundary = <P extends Record<string, any>>(
  Component: FC<P>
): FC<P> => {
  const WrappedComponent = async (props: P) => {
    try {
      return await Component(props);
    } catch (error: any) {
      // Okay to ignore the error here
      // By default this error tells next.js to switch from Static Rendering to Dynamic Rendering
      // Therefore, we can throw the same error in our custom error boundary
      if (error.digest === "DYNAMIC_SERVER_USAGE") {
        throw error;
      }

      if (
        error.digest === "NEXT_NOT_FOUND" ||
        error.digest === "NEXT_HTTP_ERROR_FALLBACK;404" ||
        error.digest === "NEXT_REDIRECT"
      ) {
        return null;
      }

      logError(error);
      if (error instanceof Error) {
        const { message, digest } = error as Error & { digest?: string };

        return (
          <div className="flex h-[50vh] w-full flex-col items-center justify-center">
            <h2>{message ?? digest ?? "Unknown error"}</h2>
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
  };
  return WrappedComponent as FC<P>;
};

export default WithServerComponentErrorBoundary;
