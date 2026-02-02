"use client";

import { FC } from "react";

import { ServicesQuizCategory } from "../constants";
import { ServicesQuizStepId } from "./quiz_state/services_quiz_answers_provider";
import { useServicesQuizFlow } from "./quiz_state/services_quiz_flow_provider";
import { ServicesQuizRootProvider } from "./quiz_state/services_quiz_root_provider";
import ServicesQuizExitModal from "./services_quiz_exit_modal";
import ServicesQuizHeader from "./services_quiz_header";
import ServicesQuizStepper from "./services_quiz_stepper";
import ServicesQuizFinal from "./steps/services_quiz_final";
import ServicesQuizStep1 from "./steps/services_quiz_step_1";
import ServicesQuizStep2 from "./steps/services_quiz_step_2";
import ServicesQuizStep3 from "./steps/services_quiz_step_3";
import ServicesQuizStep4 from "./steps/services_quiz_step_4";
import ServicesQuizStep5 from "./steps/services_quiz_step_5";

type Props = {
  initialCategory: ServicesQuizCategory | null;
};

const ServicesQuizScreen: FC<Props> = ({ initialCategory }) => {
  return (
    <ServicesQuizRootProvider
      initialCategory={initialCategory}
      exitTo="/services"
    >
      <ServicesQuizScreenInner />
    </ServicesQuizRootProvider>
  );
};

const STEP_COMPONENTS: Record<ServicesQuizStepId, FC> = {
  1: ServicesQuizStep1,
  2: ServicesQuizStep2,
  3: ServicesQuizStep3,
  4: ServicesQuizStep4,
  5: ServicesQuizStep5,
  6: ServicesQuizFinal,
};

const ServicesQuizScreenInner: FC = () => {
  const { step } = useServicesQuizFlow();
  const ActiveStep = STEP_COMPONENTS[step as ServicesQuizStepId];

  return (
    <>
      <ServicesQuizHeader />
      <main className="mx-auto flex min-h-screen max-w-5xl flex-col pt-header">
        <ServicesQuizStepper className="mx-4 mt-6 sm:mx-0" />
        <div className="mx-4 mt-6 rounded bg-gray-0 p-4 py-3 dark:bg-gray-0-dark sm:mx-0 sm:p-8 sm:py-[26px]">
          <ActiveStep />
        </div>
      </main>
      <ServicesQuizExitModal />
    </>
  );
};

export default ServicesQuizScreen;
