"use client";
import { FC, PropsWithChildren } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

const Fallback: FC<FallbackProps> = ({ error }) => {
  return (
    <div className="text-center text-red-500 dark:text-red-500-dark">
      <p>An error has occurred when rendering the feed card.</p>
      <pre className="whitespace-pre-wrap"> {error.message}</pre>
    </div>
  );
};

const PostCardErrorBoundary: FC<PropsWithChildren> = ({ children }) => {
  return <ErrorBoundary FallbackComponent={Fallback}>{children}</ErrorBoundary>;
};

export default PostCardErrorBoundary;
