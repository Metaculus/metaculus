"use client";

import React, { FC, PropsWithChildren } from "react";

import { ServicesQuizAnswersProvider } from "./services_quiz_answers_provider";
import { ServicesQuizCompletionProvider } from "./services_quiz_completion_provider";
import { ServicesQuizExitGuardProvider } from "./services_quiz_exit_guard_provider";
import { ServicesQuizFlowProvider } from "./services_quiz_flow_provider";
import { ServicesQuizProgressProvider } from "./services_quiz_progress_provider";
import { ServicesQuizCategory } from "../../constants";
import type { ServicesQuizSubmitPayload } from "../../helpers";

type Props = PropsWithChildren<{
  initialCategory: ServicesQuizCategory | null;
  exitTo?: string;
  onSubmit?: (payload: ServicesQuizSubmitPayload) => Promise<void> | void;
}>;

export const ServicesQuizRootProvider: FC<Props> = ({
  initialCategory,
  exitTo,
  onSubmit,
  children,
}) => {
  return (
    <ServicesQuizAnswersProvider category={initialCategory}>
      <ServicesQuizCompletionProvider>
        <ServicesQuizFlowProvider onSubmit={onSubmit}>
          <ServicesQuizProgressProvider>
            <ServicesQuizExitGuardProvider exitTo={exitTo}>
              {children}
            </ServicesQuizExitGuardProvider>
          </ServicesQuizProgressProvider>
        </ServicesQuizFlowProvider>
      </ServicesQuizCompletionProvider>
    </ServicesQuizAnswersProvider>
  );
};
