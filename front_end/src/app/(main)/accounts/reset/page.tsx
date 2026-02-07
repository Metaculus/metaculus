import { getTranslations } from "next-intl/server";

import PasswordReset from "@/app/(main)/accounts/reset/components/password_reset";
import { GlobalErrorContainer } from "@/components/global_error_boundary";
import ServerAuthApi from "@/services/api/auth/auth.server";
import { ApiError, logError } from "@/utils/core/errors";

export default async function ResetPassword(props: {
  searchParams: Promise<{ user_id: number; token: string }>;
}) {
  const searchParams = await props.searchParams;
  const t = await getTranslations();

  const { user_id, token } = searchParams;

  try {
    await ServerAuthApi.passwordResetVerifyToken(user_id, token);
  } catch (error) {
    logError(error);
    const err = ApiError.isApiError(error) ? error.data : error;
    return <GlobalErrorContainer error={err} />;
  }

  return (
    <main className="mx-auto min-h-min w-full max-w-3xl flex-auto rounded bg-gray-0 px-4 py-6 dark:bg-gray-0-dark sm:p-8 lg:my-8">
      <div className="flex flex-col gap-3">
        <h1 className="m-0 text-blue-800 dark:text-blue-800-dark">
          {t("passwordResetHeading")}
        </h1>
        <div className="text-sm text-gray-600 dark:text-gray-600-dark">
          {t("passwordResetPageDescription")}
        </div>
      </div>

      <PasswordReset user_id={user_id} token={token} />
    </main>
  );
}
