import { useTranslations } from "next-intl";
import React from "react";

import BinarySlider from "@/components/forecast_maker/binary_slider";
import { OnboardingStep } from "@/types/onboarding";
import { sendAnalyticsEvent } from "@/utils/analytics";

import Step from "./step";
import { extractCommunityForecast } from "../utils";

const Step3: React.FC<OnboardingStep> = ({
  onNext,
  topic,
  posts,
  onboardingState: { step3Prediction },
  setOnboardingState,
}) => {
  const t = useTranslations();

  // Find related post for Step
  const post = posts.find((obj) => obj.id === topic?.questions?.[1]);
  // Should not be the case
  if (!post) return null;
  const communityForecast = extractCommunityForecast(post);

  const handleSubmit = async () => {
    sendAnalyticsEvent("onboardingPredicted2", {
      event_category: "onboarding",
    });

    onNext();
  };

  return (
    <Step>
      <Step.Title>{t("onboardingStep4Factors")}</Step.Title>
      <div>
        <ul className="list-none space-y-2">
          {topic?.factors.map((factor, index) => (
            <li
              key={index}
              className="flex flex-row items-center justify-between gap-4 rounded-md bg-purple-400/45 p-2.5 px-4 text-sm dark:bg-purple-600/25 md:text-base"
            >
              {factor}
            </li>
          ))}
        </ul>
      </div>
      <Step.Paragraph>{t("onboardingStep4ConsideringOthers")}</Step.Paragraph>
      <Step.Paragraph>{t("onboardingStep4WhatDoYouThink")}</Step.Paragraph>
      <div className="flex flex-col gap-1 rounded-md bg-blue-200 dark:bg-blue-800">
        <Step.QuestionContainer className="rounded-none border-none py-1 pb-0">
          <Step.QuestionTitle className="mb-0 px-2 pb-0">
            {post.title}
          </Step.QuestionTitle>
        </Step.QuestionContainer>
        <div>
          <div className="py-4">
            <BinarySlider
              forecast={step3Prediction ?? communityForecast}
              onChange={(value: number) =>
                setOnboardingState((prev) => ({
                  ...prev,
                  step3Prediction: value,
                }))
              }
              isDirty={true}
              communityForecast={communityForecast}
              onBecomeDirty={() => {}}
              disabled={false}
            />

            <div className="mt-4 flex flex-col items-center">
              <Step.Button onClick={handleSubmit}>
                {t("onboardingStep4Predict")}
              </Step.Button>
            </div>
          </div>
        </div>
      </div>
    </Step>
  );
};

export default Step3;
