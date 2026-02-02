"use client";

import { useTranslations } from "next-intl";
import React, { FC } from "react";

import {
  FlowStepperRoot,
  FlowStepperSegments,
  FlowStepperNav,
  FlowStepperNavPrev,
  FlowStepperNavNext,
} from "@/components/flow/flow_stepper";

import { useServicesQuizFlow } from "./quiz_state/services_quiz_flow_provider";

type Props = {
  className?: string;
  hideOnFinalStep?: boolean;
};

const ServicesQuizStepper: FC<Props> = ({
  className,
  hideOnFinalStep = true,
}) => {
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

  const isFinalStep = step === 6;

  if (hideOnFinalStep && isFinalStep) return null;

  const prevLabel = t("previous");
  const nextLabel =
    step === 5 ? t("submit") : step === 6 ? t("next") : t("continue");

  return (
    <div className={className}>
      <FlowStepperRoot
        steps={steps}
        activeStepId={step}
        isMenuOpen={false}
        onToggleMenu={() => {}}
        onSelectStep={selectStep}
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

          <FlowStepperNavNext
            disabled={!canGoNext || nextDisabled}
            onClick={goNext}
          >
            {nextLabel}
          </FlowStepperNavNext>
        </FlowStepperNav>
      </FlowStepperRoot>
    </div>
  );
};

export default ServicesQuizStepper;
