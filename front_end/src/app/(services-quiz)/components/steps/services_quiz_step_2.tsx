"use client";

import { useTranslations } from "next-intl";
import React, { useMemo } from "react";

import ServicesQuizStepShell from "./services_quiz_step_shell";
import ServicesQuizRadioCard from "../fields/services_quiz_radio_card";
import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";

const ServicesQuizStep2: React.FC = () => {
  const t = useTranslations();
  const { state, setTiming } = useServicesQuizAnswers();

  const subtitle = useMemo(() => {
    const challenges = state.selectedChallenges;
    if (challenges.length === 0) {
      return t("timingStepSubtitleGeneric");
    }
    const challengeList =
      challenges.length <= 2
        ? challenges.join(` ${t("and")} `)
        : `${challenges.slice(0, 2).join(", ")} ${t("and")} ${t("more").toLowerCase()}`;
    return t("timingStepSubtitle", { challenges: challengeList });
  }, [state.selectedChallenges, t]);

  const options = [
    { id: "soon", label: t("soonerThanThreeMonths") },
    { id: "later", label: t("laterThanThreeMonths") },
    { id: "flexible", label: t("flexibleUnsure") },
  ] as const;

  return (
    <ServicesQuizStepShell
      title={t("howSoonDoYouNeedForecasts")}
      subtitle={subtitle}
    >
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
