import { Suspense } from "react";

import GlobalHeader from "@/app/(main)/components/headers/global_header";

import { ConfirmationHandler } from "./components/confirmation-handler";

export const metadata = {
  title: "Email Confirmation - RAND x Metaculus",
  description:
    "Confirming your registration for the RAND x Metaculus forecasting tournament.",
};

export default async function ConfirmPage() {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <GlobalHeader />
      <main
        className="flex flex-1 flex-col items-center justify-center p-6"
        style={{ minHeight: "calc(100vh - 160px)" }}
      >
        <Suspense fallback={<LoadingConfirmation />}>
          <ConfirmationHandler />
        </Suspense>
      </main>
    </div>
  );
}

function LoadingConfirmation() {
  return (
    <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-lg bg-white p-8 dark:bg-blue-100-dark md:p-12">
      <div className="flex flex-col items-center text-center">
        <div className="mb-6 h-16 w-16 animate-spin rounded-full border-4 border-gray-300 border-t-blue-600"></div>
        <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-900-dark">
          Confirming your registration...
        </h1>
        <p className="text-gray-600 dark:text-gray-600-dark">
          Please wait while we verify your email confirmation.
        </p>
      </div>
    </div>
  );
}
