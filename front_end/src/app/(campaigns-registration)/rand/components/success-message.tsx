"use client";

import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useEffect, useRef } from "react";

import Button from "@/components/ui/button";
import { useAuth } from "@/contexts/auth_context";
import { useModal } from "@/contexts/modal_context";

interface SuccessMessageProps {
  email: string;
}

export const SuccessMessage: FC<SuccessMessageProps> = ({ email }) => {
  const { user } = useAuth();
  const { setCurrentModal } = useModal();
  const nextStepRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!user && nextStepRef.current) {
      // Auto-scroll to the next step section
      setTimeout(() => {
        nextStepRef.current?.scrollIntoView({
          behavior: "smooth",
          block: "start",
        });
      }, 100);
    }
  }, [user]);

  return (
    <div className="w-full space-y-6">
      {/* Success Message Container */}
      <div className="w-full rounded bg-green-50 p-4 dark:bg-green-900/20 md:p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100 dark:bg-green-800">
            <FontAwesomeIcon
              icon={faEnvelope}
              className="h-5 w-5 text-green-600 dark:text-green-400"
            />
          </div>

          <h2 className="mb-2 text-lg font-semibold text-green-800 dark:text-green-400">
            Check your inbox!
          </h2>

          <p className="text-sm text-green-700 dark:text-green-300">
            Thank you for registering with <strong>{email}</strong>.
          </p>

          <p className="mt-2 text-xs text-green-600 dark:text-green-400">
            You will receive a confirmation email shortly. Please check your
            inbox and confirm your registration to stay updated about the RAND
            Forecasting Initiative.
          </p>
        </div>
      </div>

      {/* Next Step Container - Only for non-logged-in users */}
      {!user && (
        <div
          ref={nextStepRef}
          className="w-full rounded bg-gray-50 p-4 dark:bg-gray-800/50 md:p-6"
        >
          <div className="text-center">
            <p className="mb-3 text-sm font-medium text-blue-800 dark:text-blue-200">
              Next Step: Sign up to Metaculus
            </p>
            <p className="mb-4 text-xs text-gray-600 dark:text-gray-400">
              You&apos;ll need to sign up to the Metaculus platform using the
              same email address (<strong>{email}</strong>) to participate in
              the tournament.
            </p>
            <Button
              variant="primary"
              size="sm"
              onClick={() => setCurrentModal({ type: "signup" })}
            >
              Sign up to Metaculus
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};
