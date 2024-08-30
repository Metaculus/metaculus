import React from "react";
import { notFound } from "next/navigation";
import RefreshButton from "./refresh_button";

const ServerComponentErrorBoundary = async (
  fn: () => Promise<JSX.Element | null>
) => {
  try {
    return await fn();
  } catch (error) {
    if (error instanceof Error) {
      if (error.message.includes("404")) return notFound();
      return (
        <div className="flex h-[50vh] w-full flex-col items-center justify-center">
          <h2>{error.message ?? "Unknown error"}</h2>
          <RefreshButton />
        </div>
      );
    }

    throw error;
  }
};

export default ServerComponentErrorBoundary;
