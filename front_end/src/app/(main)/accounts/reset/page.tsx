import { notFound, redirect } from "next/navigation";

import PasswordReset from "@/app/(main)/accounts/reset/components/password_reset";
import AuthApi from "@/services/auth";
import { getServerSession } from "@/services/session";

export default async function ResetPassword({
  searchParams: { user_id, token },
}: {
  searchParams: { user_id: number; token: string };
}) {
  if (getServerSession()) {
    return redirect("/");
  }

  try {
    await AuthApi.passwordResetVerifyToken(user_id, token);
  } catch (error) {
    return notFound();
  }

  return (
    <main className="mx-auto mb-24 mt-12 flex w-full max-w-3xl flex-1 flex-col bg-gray-0 p-4 text-base text-gray-800 dark:bg-blue-900 dark:text-gray-800-dark xs:p-8">
      <PasswordReset user_id={user_id} token={token} />
    </main>
  );
}
