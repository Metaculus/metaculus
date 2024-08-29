"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState } from "react";

import { exchangeSocialOauthCode } from "@/app/(main)/accounts/social/[provider]/actions";
import GlobalErrorBoundary from "@/components/global_error_boundary";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { SocialProviderType } from "@/types/auth";

export default function ExchangeSocialAuthCode({
  code,
  provider,
}: {
  provider: SocialProviderType;
  code: string;
}) {
  const [error, setError] = useState();
  const router = useRouter();

  useEffect(() => {
    exchangeSocialOauthCode(provider, code)
      .then(() => router.push("/"))
      .catch(setError);
  }, [provider, code, router]);

  if (error) {
    return <GlobalErrorBoundary error={error} reset={() => router.push("/")} />;
  }

  return (
    <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
  );
}
