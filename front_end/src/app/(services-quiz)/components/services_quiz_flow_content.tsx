"use client";

import { FC } from "react";

import { ServicesQuizStepId } from "./quiz_state/services_quiz_answers_provider";
import { useServicesQuizFlow } from "./quiz_state/services_quiz_flow_provider";
import ServicesQuizStepper from "./services_quiz_stepper";
import ServicesQuizFinal from "./steps/services_quiz_final";
import ServicesQuizStep1 from "./steps/services_quiz_step_1";
import ServicesQuizStep2 from "./steps/services_quiz_step_2";
import ServicesQuizStep3 from "./steps/services_quiz_step_3";
import ServicesQuizStep4 from "./steps/services_quiz_step_4";
import ServicesQuizStep5 from "./steps/services_quiz_step_5";

const STEP_COMPONENTS: Record<ServicesQuizStepId, FC> = {
  1: ServicesQuizStep1,
  2: ServicesQuizStep2,
  3: ServicesQuizStep3,
  4: ServicesQuizStep4,
  5: ServicesQuizStep5,
  6: ServicesQuizFinal,
};

const ServicesQuizFlowContent: FC = () => {
  const { step } = useServicesQuizFlow();
  const ActiveStep = STEP_COMPONENTS[step];

  return (
    <main className="mx-auto flex min-h-screen max-w-[800px] flex-col pt-header antialiased">
      <ServicesQuizStepper />
      <ActiveStep />
    </main>
  );
};

export default ServicesQuizFlowContent;
