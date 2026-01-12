"use client";

import { faXmarkCircle } from "@fortawesome/free-regular-svg-icons";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import { FC, PropsWithChildren } from "react";

import { useModal } from "@/contexts/modal_context";
import cn from "@/utils/core/cn";

import { BRIDGEWATER_2026 } from "../constants";

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
        className="text-xl text-olive-900 dark:text-olive-900-dark"
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
  const { setCurrentModal } = useModal();

  return (
    <div className="rounded-md bg-blue-700 px-6 py-2 text-white dark:bg-blue-800-dark sm:px-10 sm:py-4">
      <div className="text-center">
        <h2 className="mb-2 text-xl font-bold text-white dark:text-blue-50-dark md:text-2xl">
          You&apos;re all set!
        </h2>
        <p className="mb-6 text-base text-white dark:text-blue-50-dark md:text-lg">
          Your registration is confirmed. Here&apos;s your leaderboard
          eligibility:
        </p>
      </div>

      <div className="mb-6 flex flex-col gap-3">
        <EligibilityBox isEligible={true}>Open Prize Pool</EligibilityBox>
        <EligibilityBox isEligible={eligibleBoth}>
          Undergrad Prize Pool
        </EligibilityBox>
      </div>

      <p className="mb-4 text-balance text-center text-base text-white dark:text-blue-50-dark">
        The contest is live.{" "}
        <Link
          href={BRIDGEWATER_2026.contestQuestionsUrl}
          className="font-semibold text-white underline dark:text-blue-50-dark"
        >
          Start forecasting
        </Link>
        .{" "}
        <button
          onClick={() => setCurrentModal({ type: "onboarding" })}
          className="cursor-pointer font-semibold text-white underline hover:text-blue-100 dark:text-blue-50-dark dark:hover:text-blue-100-dark"
        >
          Try the tutorial
        </button>
        .
      </p>

      <div className="mb-4 flex items-start gap-2 text-xs text-blue-200 dark:text-blue-200-dark">
        <span className="mt-0.5">*</span>
        <p className="m-0 text-left">
          Displayed prize-pool eligibility is based solely on your undergraduate
          status. For full eligibility details see the{" "}
          <Link
            href={BRIDGEWATER_2026.contestRulesUrl}
            className="text-blue-200 underline hover:text-blue-100 dark:text-blue-200-dark hover:dark:text-blue-100-dark"
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
