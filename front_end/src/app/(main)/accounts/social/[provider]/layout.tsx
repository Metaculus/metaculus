"use client";

import { useRouter } from "next/navigation";
import { FC, PropsWithChildren } from "react";
import { ErrorBoundary } from "react-error-boundary";

import { GlobalErrorContainer } from "@/components/global_error_boundary";

const SocialAuthLayout: FC<PropsWithChildren> = ({ children }) => {
  const router = useRouter();

  return (
    <ErrorBoundary
      fallbackRender={({ error }) => (
        <GlobalErrorContainer
          error={error.message}
          reset={() => router.push("/")}
        />
      )}
    >
      {children}
    </ErrorBoundary>
  );
};

export default SocialAuthLayout;
