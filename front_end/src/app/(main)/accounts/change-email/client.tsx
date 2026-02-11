"use client";

import { useRouter } from "next/navigation";
import { FC, useEffect } from "react";
import { useErrorBoundary } from "react-error-boundary";

import { confirmEmailChange } from "@/app/(main)/accounts/change-email/actions";
import LoadingIndicator from "@/components/ui/loading_indicator";

type Props = {
  token: string;
};

const ChangeEmailClient: FC<Props> = ({ token }) => {
  const router = useRouter();
  const { showBoundary } = useErrorBoundary();

  useEffect(() => {
    confirmEmailChange(token)
      .then(() => router.push("/accounts/settings/account?emailChanged=true"))
      .catch(showBoundary);
  }, [token, router, showBoundary]);

  return (
    <LoadingIndicator className="mx-auto h-8 w-24 text-gray-600 dark:text-gray-600-dark" />
  );
};

export default ChangeEmailClient;
