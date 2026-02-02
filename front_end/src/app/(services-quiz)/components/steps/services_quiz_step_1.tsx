"use client";

import { useTranslations } from "next-intl";
import { useMemo } from "react";

import Button from "@/components/ui/button";
import cn from "@/utils/core/cn";

import { SERVICES_QUIZ_CHALLENGES } from "../../constants";
import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";

const ServicesQuizStep1: React.FC = () => {
  const t = useTranslations();
  const { state, setCategory, toggleChallenge, setNotes } =
    useServicesQuizAnswers();

  const challenges = useMemo(() => {
    if (!state.category) return [];
    return SERVICES_QUIZ_CHALLENGES[state.category];
  }, [state.category]);

  return (
    <>
      <h2 className="m-0 text-center text-2xl font-bold leading-8 text-blue-800 dark:text-blue-800-dark">
        {t("selectChallengesYouAreCurrentlyFacing")}
      </h2>

      <div className="mt-6 flex flex-wrap justify-center gap-2">
        {(["enterprise", "government", "non-profit", "academia"] as const).map(
          (c) => (
            <Button
              key={c}
              variant="tertiary"
              onClick={() => setCategory(c)}
              className={cn("capitalize", {
                "border-blue-600 dark:border-blue-600-dark":
                  state.category === c,
              })}
            >
              {c}
            </Button>
          )
        )}
      </div>

      <div className="mx-auto mt-8 max-w-2xl">
        <div className="grid gap-3 sm:grid-cols-2">
          {challenges.map((ch) => {
            const isSelected = state.selectedChallenges.includes(ch);
            return (
              <button
                key={ch}
                type="button"
                className={cn(
                  "dark:bg-gray-50-dark flex w-full items-center justify-between rounded bg-gray-50 px-4 py-3 text-left text-sm font-medium text-blue-800 outline-none transition-colors dark:text-blue-800-dark",
                  "hover:bg-blue-500/10 dark:hover:bg-blue-500-dark/10",
                  "focus-visible:ring-2 focus-visible:ring-blue-400 dark:focus-visible:ring-blue-400-dark",
                  { "bg-blue-200 dark:bg-blue-200-dark": isSelected }
                )}
                onClick={() => toggleChallenge(ch)}
                disabled={!state.category}
              >
                <span>{ch}</span>
                <span className="ml-3 text-blue-700 dark:text-blue-700-dark">
                  {isSelected ? "–" : "+"}
                </span>
              </button>
            );
          })}
        </div>

        <div className="mt-4">
          <textarea
            value={state.notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder={t("typeHere")}
            className="w-full rounded border border-gray-200 bg-gray-0 p-3 text-sm outline-none focus-visible:ring-2 focus-visible:ring-blue-400 dark:border-gray-200-dark dark:bg-gray-0-dark dark:focus-visible:ring-blue-400-dark"
          />
        </div>
      </div>
    </>
  );
};

export default ServicesQuizStep1;
