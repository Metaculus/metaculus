"use client";

import { FC } from "react";

import { EmailRegistrationForm } from "./email-registration-form";

export const Hero: FC = () => {
  return (
    <div className="mt-14 flex w-full max-w-6xl flex-col items-center justify-center rounded-lg bg-white p-8 dark:bg-blue-100-dark md:mt-0 md:p-12 lg:mt-8 lg:p-16">
      {/* Main Content Container */}
      <div className="flex w-full max-w-6xl flex-col items-center justify-center gap-2 lg:flex-row lg:gap-12">
        {/* Hero Text Section */}
        <div className="flex w-full flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
          {/* Logos Section */}
          <div className="pointer-events-none mb-4 flex items-center justify-center gap-4 md:gap-8 lg:justify-start">
            {/* Metaculus M Logo */}
            <div
              className="flex aspect-square w-16 flex-shrink-0 items-center justify-center bg-blue-800 dark:bg-blue-950 sm:w-20 md:w-24"
              style={{
                width: "clamp(48px, 15vw, 96px)",
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
              className="text-4xl font-thin text-blue-800 opacity-50 dark:text-blue-800-dark"
              style={{
                fontSize: "clamp(24px, 8vw, 48px)",
              }}
            >
              ×
            </div>

            {/* RFI Logo */}
            <div
              className="h-16 w-auto flex-shrink-0 sm:h-20 md:h-24"
              style={{
                height: "clamp(48px, 15vw, 96px)",
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

          <p className="text-base font-light leading-relaxed text-gray-800 dark:text-gray-800-dark sm:text-lg md:text-xl lg:mb-0">
            Join our forecasting tournament in partnership with the RAND
            Corporation. Open to university students - test your predictive
            skills and help advance the science of forecasting.
          </p>
        </div>

        {/* Email Registration Form Section */}
        <div className="flex w-full items-center justify-center lg:w-1/2">
          <div className="w-full max-w-md">
            <EmailRegistrationForm />
          </div>
        </div>
      </div>
    </div>
  );
};
