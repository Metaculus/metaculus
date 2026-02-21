"use client";

import { useTranslations } from "next-intl";
import React, { FC } from "react";

import {
  FlowStepperRoot,
  FlowStepperSegments,
  FlowStepperNav,
  FlowStepperNavPrev,
  FlowStepperNavNext,
  FlowStepId,
} from "@/components/flow/flow_stepper";
import cn from "@/utils/core/cn";

import { useServicesQuizCompletion } from "./quiz_state/services_quiz_completion_provider";
import { useServicesQuizFlow } from "./quiz_state/services_quiz_flow_provider";

const ServicesQuizStepper: FC<{
  className?: string;
  hideOnFinalStep?: boolean;
}> = ({ className, hideOnFinalStep = true }) => {
  const t = useTranslations();

  const {
    step,
    steps,
    stepsLeft,
    canGoPrev,
    canGoNext,
    nextDisabled,
    goPrev,
    goNext,
    selectStep,
  } = useServicesQuizFlow();

  const { isStepDone } = useServicesQuizCompletion();

  const isFinalStep = step === 6;
  const isSubmitStep = step === 5;

  const handleSelectStep = (id: FlowStepId) => {
    if (id === 6) return;
    selectStep(id);
  };

  if (hideOnFinalStep && isFinalStep) return null;

  const prevLabel = t("previous");

  const stepDone = isStepDone(step);
  const nextLabel = isFinalStep
    ? t("next")
    : stepDone
      ? t("continue")
      : t("skipQuestions");

  return (
    <div className={className}>
      <FlowStepperRoot
        steps={steps}
        activeStepId={step}
        isMenuOpen={false}
        onToggleMenu={() => {}}
        onSelectStep={handleSelectStep}
      >
        <div className="flex items-center justify-between">
          <p className="m-0 text-sm font-medium text-gray-700 dark:text-gray-700-dark">
            {t("stepsLeft", { count: stepsLeft })}
          </p>
        </div>

        <FlowStepperSegments />

        <FlowStepperNav>
          <FlowStepperNavPrev disabled={!canGoPrev} onClick={goPrev}>
            {prevLabel}
          </FlowStepperNavPrev>

          {!isSubmitStep ? (
            <FlowStepperNavNext
              disabled={!canGoNext || nextDisabled}
              onClick={goNext}
              className={cn(
                stepDone
                  ? "border-blue-900 bg-blue-900 px-6 text-gray-200 shadow-md shadow-blue-900/30 hover:border-transparent hover:bg-blue-900/80 active:bg-blue-900 dark:border-blue-900-dark dark:bg-blue-900-dark dark:text-gray-200-dark dark:shadow-blue-900-dark/30 dark:hover:bg-blue-900-dark/80 dark:active:bg-blue-900-dark"
                  : "border-blue-700 text-blue-700 dark:border-blue-700-dark dark:text-blue-700-dark"
              )}
            >
              {nextLabel}
            </FlowStepperNavNext>
          ) : (
            <div className="w-[120px]" />
          )}
        </FlowStepperNav>
      </FlowStepperRoot>
    </div>
  );
};

export default ServicesQuizStepper;
