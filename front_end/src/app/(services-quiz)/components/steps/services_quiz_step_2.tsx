"use client";

import { useTranslations } from "next-intl";
import React from "react";

import ServicesQuizStepShell from "./services_quiz_step_shell";
import ServicesQuizRadioCard from "../fields/services_quiz_radio_card";
import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";

const ServicesQuizStep2: React.FC = () => {
  const t = useTranslations();
  const { state, setTiming } = useServicesQuizAnswers();

  const options = [
    { id: "soon", label: t("soonerThanThreeMonths") },
    { id: "later", label: t("laterThanThreeMonths") },
    { id: "flexible", label: t("flexibleUnsure") },
  ] as const;

  return (
    <ServicesQuizStepShell title={t("howSoonDoYouNeedForecasts")}>
      <div role="radiogroup" className="grid gap-3 sm:grid-cols-3">
        {options.map((opt) => (
          <ServicesQuizRadioCard
            key={opt.id}
            title={opt.label}
            isSelected={state.timing === opt.id}
            onSelect={() => setTiming(opt.id)}
            onDeselect={() => setTiming(null)}
          />
        ))}
      </div>
    </ServicesQuizStepShell>
  );
};

export default ServicesQuizStep2;
