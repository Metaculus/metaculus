"use client";

import { faTrophy } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Image from "next/image";
import { FC } from "react";

import Button from "@/components/ui/button";

export const HeroContent: FC = () => {
  return (
    <div className="flex w-full flex-col items-center px-4 text-center lg:items-start lg:text-left">
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
      <h1 className="mb-1 text-lg font-bold text-blue-800 dark:text-blue-200 sm:mb-4 sm:text-xl md:text-2xl lg:text-left lg:text-3xl lg:leading-tight">
        Predict the Future. Inform public policy. $10,000 in prizes.
      </h1>

      {/* Main Description */}
      <p className="mb-1 text-sm font-normal leading-relaxed text-gray-700 dark:text-gray-700-dark sm:mb-4 sm:text-base">
        Metaculus and the RAND Corporation are launching a{" "}
        <strong>national forecasting tournament</strong> for university
        students.
      </p>

      <p className="mb-1 text-sm font-normal leading-relaxed text-gray-700 dark:text-gray-700-dark sm:mb-4 sm:text-base">
        Make forecasts on key policy questions, and help decision-makers see
        what&apos;s coming next.
      </p>

      <p className="mb-1 text-base font-semibold text-blue-800 dark:text-blue-200 sm:mb-4 sm:text-lg">
        Tournament begins October 1, 2025.
      </p>

      {/* Tournament Button */}
      <Button variant="tertiary" size="md" href="/tournament/rand/">
        <FontAwesomeIcon icon={faTrophy} />
        Visit Tournament Page
      </Button>
    </div>
  );
};
