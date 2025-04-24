"use client";
import { FC, useEffect } from "react";

import Button from "@/components/ui/button";
import { extractError, logError } from "@/utils/core/errors";

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

type GlobalErrorBoundaryProps = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalErrorBoundary: FC<GlobalErrorBoundaryProps> = ({
  error,
  reset,
}) => {
  console.log("\n\n--- ERROR ---\n\n");
  console.log("Error message:", error);
  console.log("Error name:", error.stack);

  useEffect(() => {
    logError(error);
  }, [error]);

  // error.digest ensures we use display actual message on production build
  // for more info see definition of ApiError class
  return <GlobalErrorContainer error={error.digest ?? error} reset={reset} />;
};

export default GlobalErrorBoundary;
