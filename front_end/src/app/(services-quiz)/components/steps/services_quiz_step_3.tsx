"use client";

import { useTranslations } from "next-intl";
import { FC } from "react";

import cn from "@/utils/core/cn";

import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";

const ServicesQuizStep3: FC = () => {
  const t = useTranslations();
  const { state, setWhoForecasts } = useServicesQuizAnswers();

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="m-0 text-center text-2xl font-bold leading-8 text-blue-800 dark:text-blue-800-dark">
        {t("whoShouldMakeTheForecasts")}
      </h2>

      <div className="mt-8 grid gap-3 sm:grid-cols-2">
        {[
          { id: "pros", label: t("metaculusPros") },
          { id: "public", label: t("public") },
          { id: "experts", label: t("clientExperts") },
          { id: "notsure", label: t("notSure") },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setWhoForecasts(opt.id)}
            className={cn(
              "rounded border bg-gray-0 p-4 text-left text-sm dark:bg-gray-0-dark",
              {
                "border-blue-600 dark:border-blue-600-dark":
                  state.whoForecasts === opt.id,
                "border-gray-200 dark:border-gray-200-dark":
                  state.whoForecasts !== opt.id,
              }
            )}
          >
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
};

export default ServicesQuizStep3;
