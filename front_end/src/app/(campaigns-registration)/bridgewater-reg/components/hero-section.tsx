"use client";

import { FC } from "react";

import { EmailRegistrationForm } from "./email-registration-form";

export const Hero: FC = () => {
  return (
    <div className="mt-14 flex w-full max-w-7xl flex-col items-center justify-center rounded-lg bg-white p-6 dark:bg-blue-100-dark sm:p-10 md:p-12 lg:mt-16 lg:p-16">
      {/* Main Content Container */}
      <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-0 lg:flex-row lg:gap-12">
        {/* Hero Text Section - Expanded to take more space */}
        <div className="flex w-full flex-col items-center text-center lg:w-1/2 lg:items-start lg:text-left">
          {/* Logos */}
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
          </div>

          {/* Main Headline */}
          <h1 className="mb-4 text-lg font-bold text-blue-800 dark:text-blue-200 sm:text-2xl md:mb-1 md:text-3xl lg:text-left lg:text-4xl lg:leading-tight">
            Coming 2026: Bridgewater x Metaculus Forecasting Contest
          </h1>

          {/* Main Description */}
          <p className="mb-4 text-sm font-normal leading-relaxed text-gray-700 dark:text-gray-700-dark sm:text-lg md:mb-1 md:text-xl">
            Reserve your spot now and we&#39;ll reach out in advance of the
            competition.
          </p>
        </div>

        {/* Right Column: Why Join + Email Registration Form */}
        <div className="flex w-full flex-col-reverse items-center justify-center space-y-8 md:flex-col lg:w-1/2 ">
          {/* Email Registration Form */}
          <div className="w-full">
            <EmailRegistrationForm />
          </div>
        </div>
      </div>
    </div>
  );
};
