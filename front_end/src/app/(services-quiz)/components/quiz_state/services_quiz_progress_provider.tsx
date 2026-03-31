"use client";

import React, {
  createContext,
  FC,
  PropsWithChildren,
  useContext,
  useMemo,
} from "react";

import { useServicesQuizAnswers } from "./services_quiz_answers_provider";
import { useServicesQuizFlow } from "./services_quiz_flow_provider";

type ProgressApi = { hasProgress: boolean };

const Ctx = createContext<ProgressApi | null>(null);

export const useServicesQuizProgress = () => {
  const ctx = useContext(Ctx);
  if (!ctx)
    throw new Error("useServicesQuizProgress must be used within provider");
  return ctx;
};

export const ServicesQuizProgressProvider: FC<PropsWithChildren> = ({
  children,
}) => {
  const { state } = useServicesQuizAnswers();
  const { step } = useServicesQuizFlow();

  const hasProgress = useMemo(() => {
    return (
      step > 1 ||
      state.selectedChallenges.length > 0 ||
      state.notes.trim().length > 0 ||
      !!state.timing ||
      !!state.whoForecasts ||
      !!state.privacy ||
      state.contactName.trim().length > 0 ||
      state.contactEmail.trim().length > 0
    );
  }, [step, state]);

  return <Ctx.Provider value={{ hasProgress }}>{children}</Ctx.Provider>;
};
