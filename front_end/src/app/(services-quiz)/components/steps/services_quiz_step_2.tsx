"use client";

import { useTranslations } from "next-intl";

import cn from "@/utils/core/cn";

import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";

const ServicesQuizStep2: React.FC = () => {
  const t = useTranslations();
  const { state, setTiming } = useServicesQuizAnswers();

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="m-0 text-center text-2xl font-bold leading-8 text-blue-800 dark:text-blue-800-dark">
        {t("howSoonDoYouNeedForecasts")}
      </h2>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { id: "soon", label: t("soonerThanThreeMonths") },
          { id: "later", label: t("laterThanThreeMonths") },
          { id: "flexible", label: t("flexibleUnsure") },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setTiming(opt.id)}
            className={cn(
              "rounded border bg-gray-0 p-4 text-left text-sm dark:bg-gray-0-dark",
              {
                "border-blue-600 dark:border-blue-600-dark":
                  state.timing === opt.id,
                "border-gray-200 dark:border-gray-200-dark":
                  state.timing !== opt.id,
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

export default ServicesQuizStep2;
