"use client";

import Image from "next/image";
import { FC } from "react";

import { EmailRegistrationForm } from "./email-registration-form";

export const Hero: FC = () => {
  return (
    <div className="mt-14 flex w-full max-w-7xl flex-col items-center justify-center rounded-lg bg-white p-6 dark:bg-blue-100-dark sm:p-10 md:p-12 lg:mt-16 lg:p-16">
      {/* Main Content Container */}
      <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-0 lg:flex-row lg:gap-12">
        {/* Hero Text Section - Expanded to take more space */}
        <div className="flex w-full flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
          {/* Logos Section */}
          <div className="pointer-events-none mb-3 mt-2 flex items-center justify-center gap-4 sm:mb-6 md:gap-8 lg:justify-start">
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
              <Image
                src="/partners/rfi-logo-light.svg"
                alt="RAND Forecasting Initiative Logo"
                width={352}
                height={164}
                className="h-full w-auto dark:hidden"
                sizes="100vw"
                priority
                unoptimized
              />
              <Image
                src="/partners/rfi-logo-dark.svg"
                alt="RAND Forecasting Initiative Logo"
                width={352}
                height={164}
                className="hidden h-full w-auto dark:block"
                sizes="100vw"
                priority
                unoptimized
              />
            </div>
          </div>

          {/* Main Headline */}
          <h1 className="mb-1 text-lg font-bold text-blue-800 dark:text-blue-200 sm:mb-4 sm:text-2xl md:text-3xl lg:text-left lg:text-4xl lg:leading-tight">
            Predict the Future. Inform public policy. $10,000 in prizes.
          </h1>

          {/* Main Description */}
          <p className="mb-1 text-sm font-normal leading-relaxed text-gray-700 dark:text-gray-700-dark sm:mb-4 sm:text-lg md:text-xl">
            Metaculus and the RAND Corporation are launching a{" "}
            <strong>national forecasting tournament</strong> for university
            students.
          </p>

          <p className="mb-1 text-sm font-normal leading-relaxed text-gray-700 dark:text-gray-700-dark sm:mb-4 sm:text-lg">
            Make forecasts on key policy questions, and help decision-makers see
            what&apos;s coming next.
          </p>

          <p className="mb-1 text-base font-semibold text-blue-800 dark:text-blue-200 sm:mb-4 sm:text-xl">
            Tournament begins October 1, 2025.
          </p>
        </div>

        {/* Right Column: Why Join + Email Registration Form */}
        <div className="flex w-full flex-col-reverse items-center justify-center space-y-8 md:flex-col lg:w-1/2 ">
          {/* Why Join Section */}
          <div className="w-full">
            <h2 className="mb-4 text-base font-semibold text-gray-800 dark:text-gray-200 sm:text-xl">
              Why join:
            </h2>

            <ul className="space-y-3 text-sm text-gray-800 dark:text-gray-800-dark sm:text-base">
              <li className="flex items-center">
                <span className="mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></span>
                $10,000 prize pool
              </li>
              <li className="flex items-center">
                <span className="mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></span>
                Opportunities to publish
              </li>
              <li className="flex items-center">
                <span className="mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></span>
                Potential roles as a RAND Pro Forecaster
              </li>
              <li className="flex items-center">
                <span className="mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></span>
                Strengthen skills and build a track record for future employers
              </li>
              <li className="flex items-center">
                <span className="mr-3 h-2 w-2 flex-shrink-0 rounded-full bg-blue-600"></span>
                Connect with and compete against student forecasters from around
                the country
              </li>
            </ul>
          </div>

          {/* Email Registration Form */}
          <div className="w-full">
            <EmailRegistrationForm />
          </div>
        </div>
      </div>
    </div>
  );
};
