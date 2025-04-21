import { useTranslations } from "next-intl";
import React, { useEffect } from "react";

import { OnboardingStep } from "@/types/onboarding";
import { sendAnalyticsEvent } from "@/utils/analytics";

import Step from "./step";
import { ONBOARDING_TOPICS } from "../utils";

const Step0: React.FC<OnboardingStep> = ({ setTopic }) => {
  const t = useTranslations();

  useEffect(() => {
    sendAnalyticsEvent("onboardingStarted", {
      event_category: "onboarding",
    });
  }, []);

  return (
    <Step>
      <p className="my-2 mt-4 text-left text-xl font-semibold leading-relaxed text-blue-800  dark:text-blue-200  md:text-3xl md:leading-relaxed ">
        <span className="opacity-60">&quot;</span>
        {t("onboardingStep1Question1")}
        <span className="opacity-60">&quot;</span> <br />
        <span className="opacity-60">
          <span className="opacity-60">&quot;</span>
          {t("onboardingStep1Question2")}
          <span className="opacity-60">&quot;</span>{" "}
        </span>
        <br />
        <span className="opacity-30">
          <span className="opacity-60">&quot;</span>
          {t("onboardingStep1Question3")}
          <span className="opacity-50">&quot;</span>
        </span>
      </p>
      <div className="my-4 md:my-6">
        <Step.Paragraph>{t("onboardingStep1Paragraph1")}</Step.Paragraph>
        <Step.Paragraph>{t("onboardingStep1Paragraph2")}</Step.Paragraph>
        <Step.Paragraph>{t("onboardingStep1Paragraph3")}</Step.Paragraph>
      </div>
      <div className="mt-1 flex w-full flex-col gap-2 md:mt-5 md:flex-row md:gap-4">
        {ONBOARDING_TOPICS.map((topic, index) => (
          <button
            key={index}
            onClick={() => {
              sendAnalyticsEvent("onboardingTopicSelected", {
                event_category: "onboarding",
                event_label: topic.name,
              });
              setTopic(index);
            }}
            className="flex w-full flex-row items-center justify-start gap-3 rounded bg-blue-400/50 px-4 py-3 text-lg font-semibold text-blue-800 hover:bg-blue-500 dark:bg-blue-700/50 dark:text-blue-200 dark:hover:bg-blue-600 md:flex-col md:justify-center md:px-8 md:py-6 md:text-xl"
          >
            <span className="text-xl md:text-4xl md:leading-none">
              {topic.emoji}
            </span>
            {topic.name}
          </button>
        ))}
      </div>
    </Step>
  );
};

export default Step0;
