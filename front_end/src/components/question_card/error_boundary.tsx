"use client";
import { FC, PropsWithChildren } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

const Fallback: FC<FallbackProps> = ({ error }) => {
  return (
    <div className="text-center text-metac-red-500 dark:text-metac-red-500-dark">
      <p>An error has occurred when rendering the feed card.</p>
      <pre> {error.message}</pre>
    </div>
  );
};

const QuestionCardErrorBoundary: FC<PropsWithChildren> = ({ children }) => {
  return <ErrorBoundary FallbackComponent={Fallback}>{children}</ErrorBoundary>;
};

export default QuestionCardErrorBoundary;
