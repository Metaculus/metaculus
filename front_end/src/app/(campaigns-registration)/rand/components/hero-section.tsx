"use client";

import { FC, useState } from "react";

import { EmailRegistrationForm } from "./email-registration-form";
import { HeroContent } from "./hero-content";
import { WhyJoin } from "./why-join";

type SubmissionState =
  | { status: "idle" }
  | { status: "loading" }
  | { status: "success"; email: string }
  | { status: "error"; message: string };

export const Hero: FC = () => {
  const [submissionState, setSubmissionState] = useState<SubmissionState>({
    status: "idle",
  });

  const isSuccess = submissionState.status === "success";

  return (
    <div className="mt-14 flex w-full max-w-7xl flex-col items-center justify-center rounded-lg bg-white p-3 dark:bg-blue-100-dark sm:p-10 md:p-12 lg:mt-16 lg:p-16">
      {/* Desktop: Hero + Why Join side-by-side, Mobile: Hero first */}
      <div className="flex w-full max-w-7xl flex-col items-center justify-center gap-8 lg:flex-row lg:gap-12">
        {/* Hero Text Section - 2/3 width on desktop */}
        <div className="w-full lg:w-2/3">
          <HeroContent />
        </div>

        {/* Why Join Section - 1/3 width on desktop, Desktop: visible, Mobile: hidden (shown later) */}
        {!isSuccess && (
          <div className="hidden w-full lg:block lg:w-1/3">
            <WhyJoin />
          </div>
        )}
      </div>

      {/* Form Section - Full width on desktop, normal on mobile */}
      <div className="mt-8 w-full lg:mt-12">
        <EmailRegistrationForm
          submissionState={submissionState}
          setSubmissionState={setSubmissionState}
        />
      </div>

      {/* Why Join Section - Mobile: visible, Desktop: hidden */}
      {!isSuccess && (
        <div className="mt-8 w-full lg:hidden">
          <WhyJoin />
        </div>
      )}
    </div>
  );
};
