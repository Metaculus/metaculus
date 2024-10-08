"use client";

import * as Sentry from "@sentry/nextjs";
import { useEffect } from "react";

import GlobalErrorBoundary from "@/components/global_error_boundary";

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    Sentry.captureException(props.error);
  }, [props.error]);

  return <GlobalErrorBoundary {...props} />;
}
