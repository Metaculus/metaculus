"use client";

import { faXmarkCircle } from "@fortawesome/free-regular-svg-icons";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import cn from "@/utils/core/cn";

interface EligibilityStatusProps {
  eligibleBoth: boolean;
}

const EligibilityBox: FC<PropsWithChildren<{ isEligible: boolean }>> = ({
  children,
  isEligible,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 rounded bg-olive-400 px-4 py-3 dark:bg-olive-400-dark",
        !isEligible && "bg-salmon-400 dark:bg-salmon-400-dark"
      )}
    >
      <FontAwesomeIcon
        icon={isEligible ? faCheckCircle : faXmarkCircle}
        className="text-xl"
      />
      <span className="flex-1 font-normal text-gray-800 dark:text-gray-800-dark">
        {children}
      </span>
      <span
        className={cn(
          "ml-auto whitespace-nowrap font-bold text-olive-800 dark:text-olive-800-dark",
          !isEligible && "text-salmon-800 dark:text-salmon-800-dark"
        )}
      >
        {isEligible ? "Eligible *" : "Not Eligible *"}
      </span>
    </div>
  );
};

/**
 * Shows eligibility status after successful registration
 * Matches the mockup design
 */
const EligibilityStatus: FC<EligibilityStatusProps> = ({ eligibleBoth }) => {
  return (
    <div className="rounded-md bg-blue-700 p-6 text-white dark:bg-blue-700-dark sm:p-8">
      <div className="text-center">
        <h2 className="mb-2 text-2xl font-bold text-white md:text-3xl">
          You're all set!
        </h2>
        <p className="mb-6 text-base text-white/90 md:text-lg">
          Your registration is confirmed. Here's your leaderboard eligibility:
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <EligibilityBox isEligible={true}>Open Prize Pool</EligibilityBox>
        <EligibilityBox isEligible={eligibleBoth}>
          Undergrad Prize Pool
        </EligibilityBox>
      </div>

      <p className="mb-4 text-center text-base text-white/90">
        Ready to get started? Try the{" "}
        <Link
          href="/tournament/bridgewater/"
          className="font-semibold text-white underline hover:text-white/80"
        >
          forecasting tutorial
        </Link>{" "}
        or explore some{" "}
        <Link
          href="/tournament/bridgewater/"
          className="font-semibold text-white underline hover:text-white/80"
        >
          warmup questions
        </Link>{" "}
        to sharpen your skills!
      </p>

      <div className="flex items-start gap-2 text-xs text-blue-200 dark:text-blue-200">
        <span className="mt-0.5">*</span>
        <p className="m-0 text-left">
          Displayed prize-pool eligibility is based solely on your undergraduate
          status. For full eligibility details see the{" "}
          <Link
            href="/bridgewater/contest-rules"
            className="text-blue-200 underline hover:text-blue-100"
          >
            contest rules
          </Link>
          .
        </p>
      </div>
    </div>
  );
};

export default EligibilityStatus;
