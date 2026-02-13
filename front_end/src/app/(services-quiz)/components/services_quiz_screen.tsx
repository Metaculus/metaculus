"use client";

import { FC, useCallback } from "react";

import { appendServicesQuizRow } from "../append_services_quiz_row";
import { ServicesQuizCategory } from "../constants";
import { ServicesQuizStepId } from "./quiz_state/services_quiz_answers_provider";
import { useServicesQuizFlow } from "./quiz_state/services_quiz_flow_provider";
import { ServicesQuizRootProvider } from "./quiz_state/services_quiz_root_provider";
import ServicesQuizExitModal from "./services_quiz_exit_modal";
import ServicesQuizHeader from "./services_quiz_header";
import ServicesQuizStepper from "./services_quiz_stepper";
import { ServicesQuizSubmitPayload } from "../helpers";
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
  const onSubmit = useCallback(async (payload: ServicesQuizSubmitPayload) => {
    await appendServicesQuizRow(payload);
  }, []);

  return (
    <ServicesQuizRootProvider
      initialCategory={initialCategory}
      exitTo="/services"
      onSubmit={onSubmit}
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
  const ActiveStep =
    STEP_COMPONENTS[step as ServicesQuizStepId] ?? STEP_COMPONENTS[1];

  return (
    <>
      <ServicesQuizHeader />
      <main className="mx-auto flex min-h-screen max-w-[800px] flex-col pt-header antialiased">
        <ServicesQuizStepper />
        <ActiveStep />
      </main>
      <ServicesQuizExitModal />
    </>
  );
};

export default ServicesQuizScreen;
