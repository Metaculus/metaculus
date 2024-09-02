"use client";

import GlobalErrorBoundary from "@/components/global_error_boundary";
import * as Sentry from "@sentry/nextjs";

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  Sentry.captureException(props.error);
  return <GlobalErrorBoundary {...props} />;
}
