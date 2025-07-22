"use client";

import { faEnvelope } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC } from "react";

interface SuccessMessageProps {
  email: string;
}

export const SuccessMessage: FC<SuccessMessageProps> = ({ email }) => {
  return (
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
          You will receive a confirmation email shortly. Please check your inbox
          and confirm your registration to stay updated about the RAND
          Forecasting Initiative.
        </p>
      </div>
    </div>
  );
};
