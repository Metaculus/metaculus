"use client";

import { FC } from "react";

export const WhyJoin: FC = () => {
  return (
    <div className="w-full rounded-lg bg-blue-300 px-8 py-4 pb-8 dark:bg-blue-300-dark">
      <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-200 sm:text-xl">
        WHY SHOULD I JOIN THE COMPETITION?
      </h2>

      <p className="mb-4 text-sm text-gray-700 dark:text-gray-700-dark sm:text-base">
        Beyond learning how to forecast, university students can gain unique
        benefits:
      </p>

      <ul className="space-y-3 text-sm text-gray-800 dark:text-gray-800-dark sm:text-base">
        <li className="flex items-start">
          <span className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></span>
          $10,000 in prizes
        </li>
        <li className="flex items-start">
          <span className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></span>
          One-year acceptance into the RAND Pro Forecaster ranks
        </li>
        <li className="flex items-start">
          <span className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></span>
          A spotlight feature on the RFI blog to boost professional exposure
        </li>
        <li className="flex items-start">
          <span className="mr-3 mt-2 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></span>
          Special guest attendance at a RAND event for recognition and
          networking
        </li>
      </ul>
    </div>
  );
};
