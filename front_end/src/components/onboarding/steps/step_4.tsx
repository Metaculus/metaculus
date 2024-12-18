import { useTranslations } from "next-intl";
import React from "react";

import Step from "@/components/onboarding/steps/step";
import { OnboardingStep } from "@/types/onboarding";

const Step4: React.FC<OnboardingStep> = ({ topic, handleComplete, onNext }) => {
  const t = useTranslations();

  return (
    <Step>
      <Step.Title>{t("onboardingStep5NiceWork")}</Step.Title>
      <Step.Paragraph>{t("onboardingStep5AnyoneCanImprove")}</Step.Paragraph>
      <div className="flex flex-col gap-2 rounded-md bg-blue-200 p-3 dark:bg-blue-200-dark md:p-5">
        <span className="block text-xs font-bold uppercase tracking-wide opacity-70">
          {t("onboardingStep5DidYouKnow")}
        </span>
        {t("onboardingStep5ForecastingCompetition")}
      </div>
      <Step.Paragraph>
        <span className="font-bold">{t("onboardingStep4AlmostDone")}</span>
      </Step.Paragraph>
      <div className="flex w-full justify-center">
        <Step.Button onClick={onNext}>{t("next")}</Step.Button>
      </div>
    </Step>
  );
};

export default Step4;
