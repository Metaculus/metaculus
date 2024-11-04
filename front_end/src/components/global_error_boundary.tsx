"use client";
import * as Sentry from "@sentry/nextjs";
import { FC, useEffect } from "react";

import Button from "@/components/ui/button";
import { extractError } from "@/utils/errors";

type GlobalErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

type GlobalErrorProps = {
  error: any;
  reset?: () => void;
};

export const GlobalErrorContainer: FC<GlobalErrorProps> = ({
  error,
  reset,
}) => {
  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <h2 className="whitespace-break-spaces">
        {extractError(error) || "Error"}
      </h2>
      {reset && (
        <Button variant="primary" onClick={reset}>
          Try again
        </Button>
      )}
    </div>
  );
};

const GlobalErrorBoundary: FC<GlobalErrorBoundaryProps> = ({
  error,
  reset,
}) => {
  console.log("\n\n--- ERROR ---\n\n");
  console.log("Error message:", error);
  console.log("Stack: ", error.stack);
  useEffect(() => {
    Sentry.captureException(error);
  }, [error]);
  return (
    <GlobalErrorContainer
      error={(error.toString() || error.digest)!}
      reset={reset}
    />
  );
};

export default GlobalErrorBoundary;
