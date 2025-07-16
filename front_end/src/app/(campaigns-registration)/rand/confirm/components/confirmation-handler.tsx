"use client";

import { faCheck, faSpinner, faXmark } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useSearchParams } from "next/navigation";
import { useEffect, useState } from "react";

import { confirmEmailRegistration } from "../actions";

type ConfirmationState = "loading" | "success" | "error" | "invalid";

export function ConfirmationHandler() {
  const searchParams = useSearchParams();
  const [state, setState] = useState<ConfirmationState>("loading");
  const [errorMessage, setErrorMessage] = useState<string>("");

  useEffect(() => {
    const token = searchParams.get("token");
    const email = searchParams.get("email");

    if (!token || !email) {
      setState("invalid");
      setErrorMessage(
        "Invalid confirmation link. Please check your email and try again."
      );
      return;
    }

    const handleConfirmation = async () => {
      try {
        const result = await confirmEmailRegistration(token, email);
        if (result.success) {
          setState("success");
        } else {
          setState("error");
          setErrorMessage(
            result.error || "Failed to confirm email. Please try again."
          );
        }
      } catch {
        setState("error");
        setErrorMessage("An unexpected error occurred. Please try again.");
      }
    };

    handleConfirmation();
  }, [searchParams]);

  return (
    <div className="flex w-full max-w-2xl flex-col items-center justify-center rounded-lg bg-white p-8 dark:bg-blue-100-dark md:p-12">
      {/* Logos Section */}
      <div className="pointer-events-none mb-8 flex items-center justify-center gap-4 md:gap-8">
        {/* Metaculus M Logo */}
        <div
          className="flex aspect-square w-16 flex-shrink-0 items-center justify-center bg-blue-800 dark:bg-blue-950 sm:w-20 md:w-24"
          style={{
            width: "clamp(48px, 12vw, 72px)",
          }}
        >
          <svg
            className="h-3/4 w-3/4 text-white dark:text-blue-800-dark"
            viewBox="0 0 20 20"
            fill="currentColor"
            xmlns="http://www.w3.org/2000/svg"
          >
            <path d="M7.76271 17V7.11394L9.52542 17H10.4294L12.1921 7.11394V17H14V3H11.4689L9.9774 9.96852L8.48588 3H6V17H7.76271Z" />
          </svg>
        </div>

        {/* Separator */}
        <div
          className="text-3xl font-thin text-blue-800 opacity-50 dark:text-blue-800-dark"
          style={{
            fontSize: "clamp(20px, 6vw, 36px)",
          }}
        >
          ×
        </div>

        {/* RFI Logo */}
        <div
          className="h-16 w-auto flex-shrink-0 sm:h-20 md:h-24"
          style={{
            height: "clamp(48px, 12vw, 72px)",
          }}
        >
          <img
            src="/partners/rfi-logo-light.svg"
            alt="RAND Forecasting Initiative Logo"
            className="h-full w-auto dark:hidden"
          />
          <img
            src="/partners/rfi-logo-dark.svg"
            alt="RAND Forecasting Initiative Logo"
            className="hidden h-full w-auto dark:block"
          />
        </div>
      </div>

      <div className="flex flex-col items-center text-center">
        {state === "loading" && (
          <>
            <div className="mb-6 flex h-16 w-16 items-center justify-center">
              <FontAwesomeIcon
                icon={faSpinner}
                className="h-8 w-8 animate-spin text-blue-600"
              />
            </div>
            <h1 className="mb-4 text-2xl font-bold text-gray-900 dark:text-gray-900-dark">
              Confirming your registration...
            </h1>
            <p className="text-gray-600 dark:text-gray-600-dark">
              Please wait while we verify your email confirmation.
            </p>
          </>
        )}

        {state === "success" && (
          <>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900">
              <FontAwesomeIcon
                icon={faCheck}
                className="h-8 w-8 text-green-600 dark:text-green-400"
              />
            </div>
            <h1 className="mb-4 text-2xl font-bold text-green-600 dark:text-green-400">
              Email Confirmed!
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-600-dark">
              Thank you for confirming your email. You&apos;ve been successfully
              registered for the RAND x Metaculus forecasting tournament.
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500-dark">
              We&apos;ll notify you when the tournament begins. Keep an eye on
              your inbox!
            </p>
          </>
        )}

        {(state === "error" || state === "invalid") && (
          <>
            <div className="mb-6 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900">
              <FontAwesomeIcon
                icon={faXmark}
                className="h-8 w-8 text-red-600 dark:text-red-400"
              />
            </div>
            <h1 className="mb-4 text-2xl font-bold text-red-600 dark:text-red-400">
              Confirmation Failed
            </h1>
            <p className="mb-6 text-gray-600 dark:text-gray-600-dark">
              {errorMessage}
            </p>
            <p className="text-sm text-gray-500 dark:text-gray-500-dark">
              If you continue to have issues, please contact support or try
              registering again.
            </p>
          </>
        )}
      </div>
    </div>
  );
}
