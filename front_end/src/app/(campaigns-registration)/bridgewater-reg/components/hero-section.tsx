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
          {/* Main Headline */}
          <h1 className="mb-1 text-lg font-bold text-blue-800 dark:text-blue-200 sm:mb-4 sm:text-2xl md:text-3xl lg:text-left lg:text-4xl lg:leading-tight">
            Coming 2026: Bridgewater x Metaculus Forecasting Contest
          </h1>

          {/* Main Description */}
          <p className="mb-1 text-sm font-normal leading-relaxed text-gray-700 dark:text-gray-700-dark sm:mb-4 sm:text-lg md:text-xl">
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
