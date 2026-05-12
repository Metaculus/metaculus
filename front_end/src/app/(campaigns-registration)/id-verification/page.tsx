import { TopChrome } from "@/app/(main)/components/top_chrome";
import ServerProfileApi from "@/services/api/profile/profile.server";

import { getVerificationSession } from "./actions";
import LoginView from "./components/login-view";
import StatusView from "./components/status-view";
import VerifyView from "./components/verify-view";

export const metadata = {
  title: "ID Verification",
  description: "Verify your identity",
};

export default async function Page() {
  const currentUser = await ServerProfileApi.getMyProfile();
  const verificationSession = await getVerificationSession(currentUser);

  return (
    <>
      <TopChrome />
      <main className="mt-header flex h-full min-h-screen flex-col p-3 sm:p-5">
        <h1 className="text-center text-2xl font-bold">ID verification</h1>
        <p className="text-center text-sm">
          On this page you can verify your identity and link it to your
          Metaculus account.
        </p>
        <div className="mt-24 flex flex-col items-center justify-center gap-5 text-gray-900 dark:text-gray-900-dark">
          {!currentUser ? (
            <LoginView />
          ) : (
            <>
              <div className=" w-full max-w-lg rounded text-sm text-blue-800 dark:text-blue-800-dark">
                <StatusView verificationSession={verificationSession} />
              </div>
              <VerifyView
                currentUser={currentUser}
                verificationSession={verificationSession}
              />
            </>
          )}
        </div>
      </main>
    </>
  );
}
