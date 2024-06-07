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
    <main className="mx-auto min-h-min w-full max-w-3xl flex-auto rounded bg-white p-0 sm:p-2 sm:pt-0 md:p-3 lg:mt-4">
      <PasswordReset user_id={user_id} token={token} />
    </main>
  );
}
