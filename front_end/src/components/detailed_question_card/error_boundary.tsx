"use client";
import { FC, PropsWithChildren } from "react";
import { ErrorBoundary, FallbackProps } from "react-error-boundary";

const Fallback: FC<FallbackProps> = ({ error }) => {
  return (
    <div
      role="alert"
      className="h-[150] w-full rounded border border-blue-500 p-4"
    >
      <p>Something went wrong:</p>
      <pre className="text-red-400"> {error.message}</pre>
    </div>
  );
};

const DetailsQuestionCardErrorBoundary: FC<PropsWithChildren> = ({
  children,
}) => {
  return <ErrorBoundary FallbackComponent={Fallback}>{children}</ErrorBoundary>;
};

export default DetailsQuestionCardErrorBoundary;
