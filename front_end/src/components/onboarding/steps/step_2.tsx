import { useTranslations } from "next-intl";
import React from "react";

import BinarySlider from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import { OnboardingStep } from "@/types/onboarding";
import { extractPrevBinaryForecastValue } from "@/utils/forecasts/initial_values";

import Step from "./step";
import { extractCommunityForecast } from "../utils";
import VerbalForecast from "../verbal_forecast";

const Step2: React.FC<OnboardingStep> = ({
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

  const handleSubmit = () => {
    if (typeof step3Prediction === "undefined") {
      setOnboardingState((prev) => ({
        ...prev,
        step3Prediction: communityForecast * 100,
      }));
    }

    onNext();
  };

  const onPredictionChange = (value: number) => {
    setOnboardingState((prev) => ({ ...prev, step3Prediction: value }));
  };

  return (
    <Step>
      <Step.Title>
        {t("onboardingStep3Title", { topicName: topic?.name })}
      </Step.Title>
      <Step.QuestionContainer>
        <Step.QuestionTitle>{post.title}</Step.QuestionTitle>
        {communityForecast !== undefined && (
          <Step.QuestionParagraph>
            {t("onboardingStep3CommunityThinks")}{" "}
            <VerbalForecast forecast={communityForecast} />.{" "}
            {t("onboardingStep3CommunityGives")}{" "}
            <span className="rounded bg-blue-700/20 px-1 py-0.5 font-semibold text-blue-800 dark:bg-blue-400/20 dark:text-blue-200">
              {(communityForecast * 100).toFixed(0)}%
            </span>
          </Step.QuestionParagraph>
        )}
      </Step.QuestionContainer>
      <p>{t("onboardingStep3WhatDoYouThink")}</p>
      <div className="rounded-md bg-blue-200 py-4 dark:bg-blue-800">
        <BinarySlider
          forecast={
            step3Prediction ?? extractPrevBinaryForecastValue(communityForecast)
          }
          onChange={onPredictionChange}
          isDirty={true}
          communityForecast={communityForecast}
          onBecomeDirty={() => {}}
          disabled={false}
          helperDisplay={true}
        />
        <div className="mt-6 flex justify-center">
          <Step.Button onClick={handleSubmit}>
            {t("onboardingStep3Predict")}
          </Step.Button>
        </div>
      </div>
    </Step>
  );
};

export default Step2;
