"use client";
import { FC } from "react";

import Button from "@/components/ui/button";

type Props = {
  error: Error & { digest?: string };
  reset: () => void;
};

const GlobalErrorBoundary: FC<Props> = ({ error, reset }) => {
  console.log("\n\n--- ERROR ---\n\n");
  console.log("Error message:", error);
  console.log("Stack: ", error.stack);

  return (
    <div className="flex h-screen w-full flex-col items-center justify-center">
      <h2>{error.digest}</h2>
      <Button variant="primary" onClick={reset}>
        Try again
      </Button>
    </div>
  );
};

export default GlobalErrorBoundary;
