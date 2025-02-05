"use client";

import { faXmarkCircle } from "@fortawesome/free-regular-svg-icons";
import { faCheckCircle } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useRouter } from "next/navigation";
import React, { FC, PropsWithChildren, useState } from "react";

import BaseModal from "@/components/base_modal";
import { CurrentUser } from "@/types/users";
import cn from "@/utils/cn";

import { BWRegisterButton, ChoicesButtons } from "./hero-section";
import { fbPixelTrackEvent, lnkdTrack } from "./pixel-apis";
import {
  RegistrationAndSignupForm,
  RegistrationForm,
} from "./registration-forms";
import { CAMPAIGN_KEY } from "../constants";

const HeadingText: FC<{ heading: string; subheading: string }> = ({
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

const NotLoggedInFragmentBeforeRegister: FC<{
  onSignupClicked: () => void;
}> = ({ onSignupClicked }) => (
  <>
    <HeadingText
      heading={"Join the Tournament"}
      subheading={`Log in if you already have a Metaculus account. If you’re new, you can
    create an account and register for the contest in one step.`}
    />
    <ChoicesButtons
      className="flex flex-col items-center gap-3"
      onSignupClicked={onSignupClicked}
    />
  </>
);

const LoggedInNotRegisteredFragment: FC<{
  currentUser: CurrentUser;
  onRegisterClicked: () => void;
}> = ({ currentUser, onRegisterClicked }) => (
  <>
    <HeadingText
      heading={"Join the Contest"}
      subheading={"Complete your registration to join the contest"}
    />

    <p className="my-0 text-xs font-normal text-blue-400 dark:text-blue-400-dark dark:text-gray-0-dark">
      logged in as{" "}
      <span className="font-bold text-gray-100 dark:text-gray-100-dark">
        {currentUser.username}
      </span>
    </p>

    <BWRegisterButton onClick={onRegisterClicked}>
      Register for the Contest
    </BWRegisterButton>
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
        heading={"You’re all set!"}
        subheading={
          "Your registration is confirmed. Here’s your leaderboard eligibility:"
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
        <a target="_blank" href="/tournament/bridgewater/">
          Tournament page
        </a>{" "}
        to start forecasting!
      </p>

      <div className="flex items-start gap-1.5 text-xs text-blue-400 dark:text-blue-400-dark">
        <span className="my-0">*</span>
        <p className="my-0 text-left">
          Displayed prize-pool eligibility is based solely on your undergraduate
          status. For full eligibility details see the{" "}
          <a target="_blank" href="contest-rules">
            contest rules
          </a>
          .
        </p>
      </div>
    </>
  );
};

const SignupCompleteFragment: FC<{ email: string }> = ({ email }) => (
  <div>
    <h2 className="my-0 text-base text-gray-0 dark:text-gray-0-dark xs:text-lg sm:text-lg md:text-2xl  xl:text-3xl">
      Check your inbox!
    </h2>
    <p className="mb-0 mt-5 text-sm text-gray-0 dark:text-gray-0-dark xs:text-base sm:text-sm md:text-lg ">
      To complete your registration, confirm your email address. We’ve sent a
      confirmation link to your inbox <span className="italic">({email})</span>.
      Once confirmed, you’ll be ready to join the competition.
    </p>
  </div>
);

interface RegisterAndStatusProps {
  className?: string;
  currentUser: CurrentUser | null;
}

export const RegisterAndStatus: FC<RegisterAndStatusProps> = ({
  className,
  currentUser,
}) => {
  const [registerDialogVisible, setRegisterDialogVisible] = useState(false);
  const [signupDialogVisible, setSignupDialogVisible] = useState(false);

  const router = useRouter();
  const [signupCompleteEmail, setSignupCompleteEmail] = useState<string | null>(
    null
  );
  const campaigns = currentUser?.registered_campaigns.filter(
    ({ key }) => key == CAMPAIGN_KEY
  );

  const registered = campaigns && campaigns.length > 0;
  const campaignDetails =
    registered && (campaigns[0]?.details as { undergrad: boolean });

  return (
    <>
      <div
        id="registration"
        className={cn(
          "flex flex-col items-center justify-center gap-5 rounded bg-blue-700 px-6 py-7 pb-8 text-center font-medium dark:bg-blue-700-dark md:px-8 md:py-10 md:pb-12",
          className
        )}
      >
        {!currentUser && !signupCompleteEmail && (
          <NotLoggedInFragmentBeforeRegister
            onSignupClicked={() => {
              setSignupDialogVisible(true);
            }}
          />
        )}

        {!currentUser && signupCompleteEmail && (
          <SignupCompleteFragment email={signupCompleteEmail} />
        )}

        {currentUser && !registered && (
          <LoggedInNotRegisteredFragment
            currentUser={currentUser}
            onRegisterClicked={() => {
              setRegisterDialogVisible(true);
            }}
          />
        )}

        {registered && (
          <LoggedInAndRegisteredFragment
            eligibleBoth={campaignDetails ? campaignDetails.undergrad : false}
          />
        )}
      </div>
      <BaseModal
        isOpen={signupDialogVisible}
        onClose={() => {
          setSignupDialogVisible(false);
        }}
      >
        <div className="max-w-[596px]">
          <RegistrationAndSignupForm
            onSuccess={(email) => {
              setSignupCompleteEmail(email);
              fbPixelTrackEvent("CompleteRegistration");
              lnkdTrack();
              setSignupDialogVisible(false);
            }}
            campaignKey={CAMPAIGN_KEY}
          />
        </div>
      </BaseModal>

      <BaseModal
        isOpen={registerDialogVisible}
        onClose={() => {
          setRegisterDialogVisible(false);
        }}
      >
        <div className="max-w-[457px]">
          <RegistrationForm
            onSuccess={() => {
              router.refresh();
              fbPixelTrackEvent("CompleteRegistration");
              lnkdTrack();
              setRegisterDialogVisible(false);
            }}
            campaignKey={CAMPAIGN_KEY}
          />
        </div>
      </BaseModal>
    </>
  );
};
