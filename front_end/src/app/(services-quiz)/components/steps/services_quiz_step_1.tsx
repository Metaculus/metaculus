"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import ServicesQuizStepShell from "./services_quiz_step_shell";
import { SERVICES_QUIZ_CHALLENGES } from "../../constants";
import ServicesQuizNotesInput from "../fields/services_quiz_notes_input";
import ServicesQuizToggleChip from "../fields/services_quiz_toggle_chip";
import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";

const ServicesQuizStep1: React.FC = () => {
  const t = useTranslations();
  const { state, toggleChallenge, setNotes } = useServicesQuizAnswers();

  const challenges = useMemo(() => {
    if (!state.category) return [];
    return SERVICES_QUIZ_CHALLENGES[state.category];
  }, [state.category]);

  return (
    <ServicesQuizStepShell title={t("selectChallengesYouAreCurrentlyFacing")}>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {challenges.map((ch) => (
          <ServicesQuizToggleChip
            key={ch}
            label={ch}
            isSelected={state.selectedChallenges.includes(ch)}
            onToggle={() => toggleChallenge(ch)}
            disabled={!state.category}
          />
        ))}
      </div>

      <div className="mt-4">
        <ServicesQuizNotesInput
          value={state.notes}
          onChange={setNotes}
          placeholder={t("typeHere")}
        />
      </div>
    </ServicesQuizStepShell>
  );
};

export default ServicesQuizStep1;
