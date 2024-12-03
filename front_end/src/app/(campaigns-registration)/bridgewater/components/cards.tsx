"use client";

import React from "react";
import { useRouter } from "next/navigation";

import Button from "@/components/ui/button";
import { useModal } from "@/contexts/modal_context";
import { HeroSection } from "./hero-section";

export const SucessfullyRegistered = () => {
  const router = useRouter();
  const { setCurrentModal } = useModal();

  return (
    <div className="flex w-full flex-col items-center gap-7 bg-blue-200 dark:bg-blue-200-dark p-8 sm:w-[415px]">
      <p className="my-0 text-base text-gray-900 dark:text-gray-900-dark">
        You are registered!
      </p>
      <Button
        variant="tertiary"
        onClick={() => {
          router.push(`/questions`);
        }}
        className=""
      >
        Practice questions
      </Button>
      <Button
        variant="tertiary"
        onClick={() => {
          setCurrentModal({ type: "onboarding" });
        }}
        className=""
      >
        Forecasting tutorial
      </Button>
    </div>
  );
};

export const SuccessAndVerifyEmail = () => {
  return (
    <HeroSection className="m-5 w-full max-w-[896px] pb-10">
      <div className="flex w-full flex-col items-center gap-7 bg-blue-200 dark:bg-blue-200-dark p-8 sm:w-[415px]">
        <p className="my-0 text-center text-base text-gray-900 dark:text-gray-900-dark">
          You have successfully registered! Confirm your email now.
        </p>
      </div>
    </HeroSection>
  );
};
