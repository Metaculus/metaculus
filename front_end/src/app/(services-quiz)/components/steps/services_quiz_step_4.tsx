"use client";

import { useTranslations } from "next-intl";

import cn from "@/utils/core/cn";

import { useServicesQuizAnswers } from "../quiz_state/services_quiz_answers_provider";

const ServicesQuizStep4: React.FC = () => {
  const t = useTranslations();
  const { state, setPrivacy } = useServicesQuizAnswers();

  return (
    <div className="mx-auto max-w-2xl">
      <h2 className="m-0 text-center text-2xl font-bold leading-8 text-blue-800 dark:text-blue-800-dark">
        {t("privacyQuestionTitle")}
      </h2>

      <div className="mt-8 grid gap-3 sm:grid-cols-3">
        {[
          { id: "semi", label: t("semiConfidentiality") },
          { id: "full", label: t("fullConfidentiality") },
          { id: "flexible", label: t("flexibleUnsure") },
        ].map((opt) => (
          <button
            key={opt.id}
            type="button"
            onClick={() => setPrivacy(opt.id)}
            className={cn(
              "rounded border bg-gray-0 p-4 text-left text-sm dark:bg-gray-0-dark",
              {
                "border-blue-600 dark:border-blue-600-dark":
                  state.privacy === opt.id,
                "border-gray-200 dark:border-gray-200-dark":
                  state.privacy !== opt.id,
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

export default ServicesQuizStep4;
