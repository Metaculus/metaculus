"use client";

import { useRouter } from "next/navigation";
import React, { FC } from "react";

import Button from "@/components/ui/button";
import { useModal } from "@/contexts/modal_context";

import { HeroSection } from "./hero-section";

export const SucessfullyRegistered = () => {
  const router = useRouter();
  const { setCurrentModal } = useModal();

  return (
    <div className="flex w-full flex-col items-center gap-7 bg-blue-200 p-8 dark:bg-blue-200-dark sm:w-[415px]">
      <div>
        <p className="my-0 text-base text-gray-900 dark:text-gray-900-dark">
          You're all set! Stay tuned for tournament news and pro tips coming to
          your inbox.
        </p>
        <p className="text-base text-gray-900 dark:text-gray-900-dark">
          Get a head start with our practice questions, or check out the
          forecasting tutorial below.
        </p>
      </div>
      <Button
        variant="tertiary"
        size="md"
        onClick={() => {
          window.open(`/tournament/bridgewater-warmup/`, "_blank");
        }}
        className=""
      >
        Practice questions
      </Button>
      <Button
        size="md"
        variant="tertiary"
        onClick={() => {
          setCurrentModal({ type: "onboarding" });
        }}
        className=""
      >
        Forecasting tutorial
      </Button>

      <a
        href="https://job-boards.greenhouse.io/bridgewatercampusrecruiting/jobs/7630832002"
        target="_blank"
        className="text-blue-700 dark:text-blue-700-dark"
      >
        Share your resume with Bridgewater (optional)
      </a>
    </div>
  );
};

export const SuccessAndVerifyEmail: FC<{ email?: string }> = ({ email }) => {
  return (
    <HeroSection className="m-5 w-full max-w-[896px] pb-10">
      <div className="flex w-full flex-col items-center gap-7 bg-blue-200 p-8 dark:bg-blue-200-dark sm:w-[415px]">
        <p className="my-0 text-center text-base text-gray-900 dark:text-gray-900-dark">
          {email
            ? `To finalize your registration, please click the link on the
          verification email you received at ${email}.`
            : `To finalize your registration, please click the link on the
          verification email you received.`}
        </p>
      </div>
    </HeroSection>
  );
};
