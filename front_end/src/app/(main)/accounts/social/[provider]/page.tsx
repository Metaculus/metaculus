"use client";

import { useRouter } from "next/navigation";
import { use, useEffect } from "react";
import { useErrorBoundary } from "react-error-boundary";

import { exchangeSocialOauthCode } from "@/app/(main)/accounts/social/[provider]/actions";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { useAuth } from "@/contexts/auth_context";
import { SocialProviderType } from "@/types/auth";
import { SearchParams } from "@/types/navigation";
import { ensureRelativeRedirect } from "@/utils/navigation";

export default function SocialAuth(props: {
  params: Promise<{ provider: SocialProviderType }>;
  searchParams: Promise<SearchParams>;
}) {
  const searchParams = use(props.searchParams);
  const { provider } = use(props.params);

  const router = useRouter();
  const { csrfToken } = useAuth();
  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    if (!searchParams.state) {
      showBoundary(new Error("Missing OAuth state parameter"));
      return;
    }

    let stateData;
    try {
      stateData = JSON.parse(searchParams.state as string);
    } catch {
      showBoundary(new Error("Invalid OAuth state format"));
      return;
    }

    if (!csrfToken || stateData.nonce !== csrfToken) {
      showBoundary(new Error("Invalid OAuth CSRF state"));
      return;
    }

    const redirectUrl = ensureRelativeRedirect(stateData.redirect);

    exchangeSocialOauthCode(provider, searchParams.code as string)
      .then(() => router.push(redirectUrl))
      .catch(showBoundary);
  }, [
    provider,
    searchParams.code,
    searchParams.state,
    router,
    csrfToken,
    showBoundary,
  ]);

  return (
    <main className="mx-auto my-12 flex min-h-min w-full max-w-5xl flex-col gap-4 px-3 lg:px-0">
      <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
    </main>
  );
}
