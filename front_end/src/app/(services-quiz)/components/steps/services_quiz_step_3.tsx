"use client";

import { useTranslations } from "next-intl";
import { FC, useState } from "react";

import ServicesQuizStepShell from "./services_quiz_step_shell";
import ServicesQuizRadioCard from "../fields/services_quiz_radio_card";
import ServicesQuizToggleChip from "../fields/services_quiz_toggle_chip";
import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";

type Selection = "pros" | "public" | "experts";

const MULTI_OPTIONS = [
  { id: "pros", labelKey: "metaculusPros" },
  { id: "public", labelKey: "public" },
  { id: "experts", labelKey: "clientExperts" },
] as const satisfies ReadonlyArray<{
  id: Selection;
  labelKey: "metaculusPros" | "public" | "clientExperts";
}>;

const ServicesQuizStep3: FC = () => {
  const t = useTranslations();
  const [showProInfo, setShowProInfo] = useState(false);
  const {
    state,
    toggleWhoForecastsSelection,
    setWhoForecastsNotSure,
    clearWhoForecasts,
  } = useServicesQuizAnswers();

  const isNotSure = state.whoForecasts?.mode === "not_sure";
  const selected =
    state.whoForecasts?.mode === "selected"
      ? state.whoForecasts.selections
      : [];

  return (
    <ServicesQuizStepShell title={t("whoShouldMakeTheForecasts")}>
      <div className="mx-auto grid max-w-[530px] gap-3 sm:grid-cols-2">
        {MULTI_OPTIONS.map((opt) => (
          <ServicesQuizToggleChip
            key={opt.id}
            label={t(opt.labelKey)}
            isSelected={selected.includes(opt.id)}
            onToggle={() => toggleWhoForecastsSelection(opt.id)}
          />
        ))}

        <ServicesQuizRadioCard
          title={t("notSure")}
          isSelected={isNotSure}
          onSelect={setWhoForecastsNotSure}
          onDeselect={clearWhoForecasts}
        />
      </div>

      <div className="mt-3 text-center">
        <button
          type="button"
          onClick={() => setShowProInfo((v) => !v)}
          className="text-sm font-medium text-blue-700 underline hover:text-blue-900 dark:text-blue-700-dark dark:hover:text-blue-900-dark"
        >
          {t("learnAboutMetaculusPros")}
        </button>
        {showProInfo && (
          <p className="mx-auto mt-2 max-w-[480px] text-sm text-gray-700 dark:text-gray-700-dark">
            {t("metaculusProsDescription")}
          </p>
        )}
      </div>
    </ServicesQuizStepShell>
  );
};

export default ServicesQuizStep3;
