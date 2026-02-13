"use client";

import { useTranslations } from "next-intl";
import React from "react";

import ServicesQuizStepShell from "./services_quiz_step_shell";
import ServicesQuizRadioCard from "../fields/services_quiz_radio_card";
import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";

type PrivacyOption = "semi" | "full" | "flexible";

const ServicesQuizStep4: React.FC = () => {
  const t = useTranslations();
  const { state, setPrivacy } = useServicesQuizAnswers();

  const options: Array<{
    id: PrivacyOption;
    title: string;
    description?: string;
    colSpan?: string;
  }> = [
    {
      id: "semi",
      title: t("semiConfidentiality"),
      description: t("semiConfidentialityDescription"),
    },
    {
      id: "full",
      title: t("fullConfidentiality"),
      description: t("fullConfidentialityDescription"),
    },
    {
      id: "flexible",
      title: t("flexibleUnsure"),
    },
  ];

  return (
    <ServicesQuizStepShell title={t("privacyQuestionTitle")}>
      <div className="grid gap-3 sm:grid-cols-3">
        {options.map((opt) => (
          <ServicesQuizRadioCard
            key={opt.id}
            title={opt.title}
            description={opt.description}
            isSelected={state.privacy === opt.id}
            onSelect={() => setPrivacy(opt.id)}
            onDeselect={() => setPrivacy(null)}
          />
        ))}
      </div>
    </ServicesQuizStepShell>
  );
};

export default ServicesQuizStep4;
