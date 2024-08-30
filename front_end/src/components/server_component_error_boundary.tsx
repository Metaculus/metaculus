import React from "react";
import RefreshButton from "./refresh_button";

const ServerComponentErrorBoundary = async (
  fn: () => Promise<JSX.Element | null>
) => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      const { digest } = error as Error & { digest?: string };
      return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center">
          <h2>{digest ?? "Unknown error"}</h2>
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

export default ServerComponentErrorBoundary;
