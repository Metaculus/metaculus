"use client";

import * as Sentry from "@sentry/nextjs";

import GlobalErrorBoundary from "@/components/global_error_boundary";

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  Sentry.captureException(props.error);
  return <GlobalErrorBoundary {...props} />;
}
