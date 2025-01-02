"use client";

import { usePathname } from "next/navigation";

import Header from "@/app/(main)/components/headers/header";
import GlobalErrorBoundary from "@/components/global_error_boundary";
import { getWithDefaultHeader } from "@/utils/navigation";

export default function RootError(props: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  const pathname = usePathname();
  const withDefaultHeader = getWithDefaultHeader(pathname);

  return (
    <>
      {/* Ensure header is always visible in error view */}
      {/* Even if it is dynamically defined on the route */}
      {!withDefaultHeader && <Header />}
      <GlobalErrorBoundary {...props} />
    </>
  );
}
