import { FC } from "react";

import { logError } from "@/utils/errors";

import RefreshButton from "./refresh_button";

const WithServerComponentErrorBoundary = <P extends {}>(
  Component: FC<P>
): FC<P> => {
  const WrappedComponent = async (props: P) => {
    try {
      return await Component(props);
    } catch (error) {
      logError(error);
      if (error instanceof Error) {
        const { message, digest } = error as Error & { digest?: string };

        if (message === "NEXT_NOT_FOUND" || message === "NEXT_REDIRECT") {
          return null;
        }

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
