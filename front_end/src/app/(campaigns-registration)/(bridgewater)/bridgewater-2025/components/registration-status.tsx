"use client";

import { faXmarkCircle } from "@fortawesome/free-regular-svg-icons";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import Link from "next/link";
import React, { FC, PropsWithChildren } from "react";

import { CurrentUser } from "@/types/users";
import cn from "@/utils/core/cn";

const HeadingText: FC<{ heading: string; subheading: React.ReactNode }> = ({
  heading,
  subheading,
}) => {
  return (
    <div>
      <h2 className="my-0 text-xl text-gray-0 dark:text-gray-0-dark md:text-2xl lg:text-3xl xl:text-4xl">
        {heading}
      </h2>
      <p className="mb-0 mt-5 text-sm text-gray-0 opacity-70 dark:text-gray-0-dark xs:text-base sm:text-sm md:text-lg lg:text-xl ">
        {subheading}
      </p>
    </div>
  );
};

const NotLoggedInFragmentBeforeRegister: FC = () => (
  <>
    <HeadingText
      heading={"Registrations are closed"}
      subheading={
        <>
          Check out the{" "}
          <Link
            href="/tournament/bridgewater/"
            className="underline hover:text-blue-600"
          >
            tournament page
          </Link>{" "}
          to see the tournament questions.
        </>
      }
    />
  </>
);

const LoggedInNotRegisteredFragment: FC = () => (
  <>
    <HeadingText
      heading={"Registrations are closed"}
      subheading={
        <>
          Check out the{" "}
          <Link
            href="/tournament/bridgewater/"
            className="underline hover:text-blue-600"
          >
            tournament page
          </Link>{" "}
          to see the tournament questions.
        </>
      }
    />
  </>
);

const EligibilityBox: FC<PropsWithChildren<{ isEligible: boolean }>> = ({
  children,
  isEligible,
}) => {
  return (
    <div
      className={cn(
        "flex items-center gap-3 text-nowrap rounded bg-olive-400 px-2 py-1 dark:bg-olive-400-dark",
        !isEligible && "bg-salmon-400 dark:bg-salmon-400-dark"
      )}
    >
      <FontAwesomeIcon icon={isEligible ? faCheckCircle : faXmarkCircle} />
      <span className="font-normal text-gray-800 dark:text-gray-800-dark">
        {children}
      </span>
      <span
        className={cn(
          "ml-auto font-bold text-olive-800 dark:text-olive-800-dark",
          !isEligible && "text-salmon-800 dark:text-salmon-800-dark"
        )}
      >
        {isEligible ? "Eligible *" : "Not Eligible *"}
      </span>
    </div>
  );
};

const LoggedInAndRegisteredFragment: FC<{ eligibleBoth: boolean }> = ({
  eligibleBoth,
}) => {
  return (
    <>
      <HeadingText
        heading={"You're all set!"}
        subheading={
          "Your registration is confirmed. Here's your leaderboard eligibility:"
        }
      />

      <div className="flex w-full flex-col gap-1 text-base text-gray-800 dark:text-gray-800-dark">
        <EligibilityBox isEligible={true}>Open Prize Pool</EligibilityBox>

        <EligibilityBox isEligible={eligibleBoth}>
          Undergrad Prize Pool
        </EligibilityBox>
      </div>

      <p className="mb-0 mt-0 text-sm text-gray-0 dark:text-gray-0-dark xs:text-base sm:text-sm md:mt-1 md:text-lg ">
        Ready to get started? Go to the{" "}
        <Link target="_blank" href="/tournament/bridgewater/">
          Tournament page
        </Link>{" "}
        to start forecasting!
      </p>

      <div className="flex items-start gap-1.5 text-xs text-blue-400 dark:text-blue-400-dark">
        <span className="my-0">*</span>
        <p className="my-0 text-left">
          Displayed prize-pool eligibility is based solely on your undergraduate
          status. For full eligibility details see the{" "}
          <Link target="_blank" href="/bridgewater/contest-rules">
            contest rules
          </Link>
          .
        </p>
      </div>
    </>
  );
};

interface RegisterAndStatusProps {
  className?: string;
  currentUser: CurrentUser | null;
}

export const RegisterAndStatus: FC<RegisterAndStatusProps> = ({
  className,
  currentUser,
}) => {
  const campaigns = currentUser?.registered_campaigns.filter(
    ({ key }) => key == "bw_q4_2024"
  );

  const registered = campaigns && campaigns.length > 0;
  const campaignDetails =
    registered && (campaigns[0]?.details as { undergrad: boolean });

  return (
    <div
      id="registration"
      className={cn(
        "flex flex-col items-center justify-center gap-5 rounded bg-blue-700 px-6 py-7 pb-8 text-center font-medium dark:bg-blue-700-dark md:px-8 md:py-10 md:pb-12",
        className
      )}
    >
      {!currentUser && <NotLoggedInFragmentBeforeRegister />}

      {currentUser && !registered && <LoggedInNotRegisteredFragment />}

      {registered && (
        <LoggedInAndRegisteredFragment
          eligibleBoth={campaignDetails ? campaignDetails.undergrad : false}
        />
      )}
    </div>
  );
};
