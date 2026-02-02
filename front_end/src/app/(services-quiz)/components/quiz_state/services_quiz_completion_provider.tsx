"use client";

import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";

import {
  useServicesQuizAnswers,
  ServicesQuizStepId,
} from "./services_quiz_answers_provider";

type CompletionApi = {
  isStepDone: (step: ServicesQuizStepId) => boolean;
  isNextDisabled: (step: ServicesQuizStepId) => boolean;
};

const Ctx = createContext<CompletionApi | null>(null);

export const useServicesQuizCompletion = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useServicesQuizCompletion must be used within provider");
  return ctx;
};

export const ServicesQuizCompletionProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const { state } = useServicesQuizAnswers();

  const api = useMemo<CompletionApi>(() => {
    const step1Done =
      !!state.category &&
      (state.selectedChallenges.length > 0 || state.notes.trim().length > 0);

    const step2Done = !!state.timing;
    const step3Done = !!state.whoForecasts;
    const step4Done = !!state.privacy;
    const step5Done =
      state.contactName.trim().length > 0 &&
      state.contactEmail.trim().length > 0;

    const isStepDone = (s: ServicesQuizStepId) => {
      if (s === 1) return step1Done;
      if (s === 2) return step2Done;
      if (s === 3) return step3Done;
      if (s === 4) return step4Done;
      if (s === 5) return step5Done;
      if (s === 6) return false;
      return false;
    };

    const isNextDisabled = (s: ServicesQuizStepId) => {
      if (s === 1) return !state.category;
      if (s === 2) return !state.timing;
      if (s === 3) return !state.whoForecasts;
      if (s === 4) return !state.privacy;
      if (s === 5) return !step5Done;
      return true;
    };

    return { isStepDone, isNextDisabled };
  }, [state]);

  return <Ctx.Provider value={api}>{children}</Ctx.Provider>;
};
