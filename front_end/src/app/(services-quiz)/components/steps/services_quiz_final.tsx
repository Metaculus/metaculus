"use client";

import { useTranslations } from "next-intl";

import Button from "@/components/ui/button";

import { useServicesQuizExitGuard } from "../quiz_state/services_quiz_exit_guard_provider";

const ServicesQuizFinal: React.FC = () => {
  const t = useTranslations();
  const { exitNow } = useServicesQuizExitGuard();

  return (
    <div className="mx-auto flex max-w-xl flex-col items-center justify-center py-20 text-center">
      <div className="bg-olive-200 dark:bg-olive-200-dark mb-6 flex h-14 w-14 items-center justify-center rounded-full">
        <span className="text-xl">✓</span>
      </div>
      <h2 className="m-0 text-2xl font-bold text-blue-800 dark:text-blue-800-dark">
        {t("weHaveReceivedYourRequest")}
      </h2>
      <p className="mt-2 text-sm text-gray-700 dark:text-gray-700-dark">
        {t("ourTeamWillBeInContactSoon")}
      </p>

      <Button
        variant="primary"
        className="mt-8 w-full max-w-sm"
        onClick={exitNow}
      >
        {t("backToServices")}
      </Button>
    </div>
  );
};

export default ServicesQuizFinal;
