import { sendGAEvent } from "@next/third-parties/google";
import { useTranslations } from "next-intl";
import React, { useEffect } from "react";

import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";

interface Step1Props {
  onTopicSelect: (topicIndex: number) => void;
  onClose: () => void;
}

const Step1: React.FC<Step1Props> = ({ onTopicSelect, onClose }) => {
  const t = useTranslations();

  useEffect(() => {
    sendGAEvent({
      event: "onboardingStarted",
      event_category: "onboarding",
    });
  }, []);

  const handleSkipTutorial = () => {
    sendGAEvent({ event: "onboardingSkipped", event_category: "onboarding" });
    onClose();
  };

  return (
    <div className="mt-[-16px] max-w-[800px] flex-row gap-3 p-0 md:flex-col md:p-5">
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
        <p className={onboardingStyles.paragraph}>
          {t("onboardingStep1Paragraph1")}
        </p>
        <p className={onboardingStyles.paragraph}>
          {t("onboardingStep1Paragraph2")}
        </p>
        <p className={onboardingStyles.paragraph}>
          {t("onboardingStep1Paragraph3")}
        </p>
      </div>
      <div className="mt-1 flex w-full flex-col gap-2 md:mt-5 md:flex-row md:gap-4">
        {onboardingTopics.map((topic, index) => (
          <button
            key={index}
            onClick={() => {
              sendGAEvent({
                event: "onboardingTopicSelected",
                event_category: "onboarding",
                event_label: topic.name,
              });
              onTopicSelect(index);
            }}
            className={onboardingStyles.topic}
          >
            <span className="text-xl md:text-4xl md:leading-none">
              {topic.emoji}
            </span>
            {topic.name}
          </button>
        ))}
      </div>
      <div className="mt-4 flex w-full justify-start md:mt-8 md:justify-center">
        <button
          onClick={handleSkipTutorial}
          className="text-base text-blue-700 underline decoration-blue-700/70 underline-offset-4 hover:text-blue-800 hover:decoration-blue-700/90 dark:text-blue-700-dark dark:decoration-blue-700/70 dark:hover:text-blue-800-dark dark:hover:decoration-blue-700-dark/90 "
        >
          {t("skipTutorial")}
        </button>
      </div>
    </div>
  );
};

export default Step1;
