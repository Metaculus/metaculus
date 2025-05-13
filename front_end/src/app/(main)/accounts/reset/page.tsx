import { redirect } from "next/navigation";

import PasswordReset from "@/app/(main)/accounts/reset/components/password_reset";
import { GlobalErrorContainer } from "@/components/global_error_boundary";
import AuthApi from "@/services/auth";
import { getServerSession } from "@/services/session";
import { ApiError, logError } from "@/utils/core/errors";

export default async function ResetPassword(props: {
  searchParams: Promise<{ user_id: number; token: string }>;
}) {
  const searchParams = await props.searchParams;

  const { user_id, token } = searchParams;

  const serverSession = await getServerSession();
  if (serverSession) {
    return redirect("/");
  }

  try {
    await AuthApi.passwordResetVerifyToken(user_id, token);
  } catch (error) {
    logError(error);
    const err = ApiError.isApiError(error) ? error.data : error;
    return <GlobalErrorContainer error={err} />;
  }

  return (
    <main className="mx-auto mb-24 mt-12 flex w-full max-w-3xl flex-1 flex-col bg-gray-0 p-4 text-base text-gray-800 dark:bg-blue-900 dark:text-gray-800-dark xs:p-8">
      <PasswordReset user_id={user_id} token={token} />
    </main>
  );
}
