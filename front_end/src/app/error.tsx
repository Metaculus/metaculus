"use client";

import Button from "@/components/ui/button";

// TODO: add proper UI
export default function RootError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <div className="flex flex-col items-center justify-center">
      <h2>{error.message}</h2>
      <Button variant="primary" onClick={() => reset()}>
        Try again
      </Button>
    </div>
  );
}
