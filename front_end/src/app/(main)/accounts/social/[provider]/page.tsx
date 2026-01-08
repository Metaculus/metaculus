"use client";

import { useRouter } from "next/navigation";
import React, { useEffect, useState, use } from "react";

import { exchangeSocialOauthCode } from "@/app/(main)/accounts/social/[provider]/actions";
import GlobalErrorBoundary from "@/components/global_error_boundary";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { SocialProviderType } from "@/types/auth";
import { SearchParams } from "@/types/navigation";
import { logError } from "@/utils/core/errors";
import { ensureRelativeRedirect } from "@/utils/navigation";

export default function SocialAuth(props: {
  params: Promise<{ provider: SocialProviderType }>;
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = use(props.searchParams);
  const params = use(props.params);

  const { provider } = params;

  const [error, setError] = useState();
  const router = useRouter();

  useEffect(() => {
    let redirectUrl = "/";

    if (searchParams.state) {
      try {
        const stateData = JSON.parse(searchParams.state as string);
        redirectUrl = ensureRelativeRedirect(stateData.redirect);
      } catch (e) {
        logError(e);
      }
    }

    exchangeSocialOauthCode(provider, searchParams.code as string)
      .then(() => router.push(redirectUrl))
      .catch(setError);
  }, [provider, searchParams.code, searchParams.state, router]);

  if (error) {
    return <GlobalErrorBoundary error={error} reset={() => router.push("/")} />;
  }

  return (
    <main className="mx-auto my-12 flex min-h-min w-full max-w-5xl flex-col gap-4 px-3 lg:px-0">
      <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
    </main>
  );
}
