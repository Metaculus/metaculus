"use client";

import GlobalErrorBoundary from "@/components/global_error_boundary";

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return <GlobalErrorBoundary {...props} />;
}
