"use client";

import { useRouter } from "next/navigation";
import { FC, useEffect } from "react";
import { useErrorBoundary } from "react-error-boundary";

import { exchangeSocialOauthCode } from "@/app/(main)/accounts/social/[provider]/actions";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { SocialProviderType } from "@/types/auth";

type Props = {
  provider: SocialProviderType;
  code: string;
  redirectUrl: string;
};

const SocialAuthClient: FC<Props> = ({ provider, code, redirectUrl }) => {
  const router = useRouter();
  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    exchangeSocialOauthCode(provider, code)
      .then(() => router.push(redirectUrl))
      .catch(showBoundary);
  }, [provider, code, redirectUrl, router, showBoundary]);

  return (
    <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
  );
};

export default SocialAuthClient;
