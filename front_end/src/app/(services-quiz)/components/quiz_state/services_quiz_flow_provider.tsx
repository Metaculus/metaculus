"use client";

import React, {
  createContext,
  FC,
  PropsWithChildren,
  useCallback,
  useContext,
  useMemo,
  useState,
} from "react";

import { FlowStep } from "@/components/flow/flow_stepper";

import {
  ServicesQuizStepId,
  useServicesQuizAnswers,
} from "./services_quiz_answers_provider";
import { useServicesQuizCompletion } from "./services_quiz_completion_provider";
import {
  aggregateServicesQuizAnswers,
  ServicesQuizSubmitPayload,
} from "../../helpers";

const TOTAL_STEPS: ServicesQuizStepId[] = [1, 2, 3, 4, 5, 6];
const VISIBLE_STEPS: ServicesQuizStepId[] = [1, 2, 3, 4, 5];

type FlowApi = {
  step: ServicesQuizStepId;
  steps: FlowStep[];
  stepsLeft: number;

  canGoPrev: boolean;
  canGoNext: boolean;
  nextDisabled: boolean;

  isSubmitting: boolean;
  submitError: Error | null;

  goPrev: () => void;
  goNext: () => Promise<void>;
  selectStep: (id: number | string) => void;

  setStep: (s: ServicesQuizStepId) => void;
};

const Ctx = createContext<FlowApi | null>(null);

export const useServicesQuizFlow = () => {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useServicesQuizFlow must be used within provider");
  return ctx;
};

export const ServicesQuizFlowProvider: FC<
  PropsWithChildren<{
    onSubmit?: (payload: ServicesQuizSubmitPayload) => Promise<void> | void;
  }>
> = ({ onSubmit, children }) => {
  const { state } = useServicesQuizAnswers();
  const { isStepDone, isNextDisabled } = useServicesQuizCompletion();

  const [step, setStep] = useState<ServicesQuizStepId>(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<Error | null>(null);

  const steps = useMemo<FlowStep[]>(
    () =>
      VISIBLE_STEPS.map((id) => ({
        id,
        isDone: isStepDone(id) || step === 6,
      })),
    [isStepDone, step]
  );

  const stepsLeft = step >= 6 ? 0 : Math.max(0, VISIBLE_STEPS.length - step);
  const canGoPrev = step > 1;
  const canGoNext = step < 6;
  const nextDisabled = isNextDisabled(step);

  const goPrev = useCallback(() => {
    if (!canGoPrev || isSubmitting) return;
    setStep((s) => (s - 1) as ServicesQuizStepId);
  }, [canGoPrev, isSubmitting]);

  const goNext = useCallback(async () => {
    if (!canGoNext || nextDisabled || isSubmitting) return;

    if (step === 5) {
      setIsSubmitting(true);
      try {
        const payload = aggregateServicesQuizAnswers(state);
        await onSubmit?.(payload);
        setSubmitError(null);
        setStep(6);
      } catch (error) {
        setSubmitError(
          error instanceof Error ? error : new Error("Submission failed")
        );
      } finally {
        setIsSubmitting(false);
      }
      return;
    }

    setStep((s) => (s + 1) as ServicesQuizStepId);
  }, [canGoNext, nextDisabled, isSubmitting, step, onSubmit, state]);

  const selectStep = useCallback(
    (id: number | string) => {
      if (isSubmitting) return;
      const next = id as ServicesQuizStepId;
      if (!TOTAL_STEPS.includes(next)) return;
      setStep(next);
    },
    [isSubmitting]
  );

  const value = useMemo<FlowApi>(
    () => ({
      step,
      setStep,
      steps,
      stepsLeft,
      canGoPrev,
      canGoNext,
      nextDisabled,
      isSubmitting,
      submitError,
      goPrev,
      goNext,
      selectStep,
    }),
    [
      step,
      steps,
      stepsLeft,
      canGoPrev,
      canGoNext,
      nextDisabled,
      isSubmitting,
      submitError,
      goPrev,
      goNext,
      selectStep,
    ]
  );

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
};
