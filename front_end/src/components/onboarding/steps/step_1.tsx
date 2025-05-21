import { useTranslations } from "next-intl";
import React, { useRef, useState } from "react";

import BinarySlider from "@/components/forecast_maker/binary_slider";
import { extractCommunityForecast } from "@/components/onboarding/utils";
import { OnboardingStep } from "@/types/onboarding";
import { sendAnalyticsEvent } from "@/utils/analytics";

import Step from "./step";
import VerbalForecast from "../verbal_forecast";

const Step1: React.FC<OnboardingStep> = ({
  onNext,
  topic,
  posts,
  setOnboardingState,
}) => {
  const t = useTranslations();
  const [prediction, setPrediction] = useState<number | null>(null);
  const [activeButton, setActiveButton] = useState<
    "less" | "about" | "more" | null
  >(null);

  const endOfModalRef = useRef<HTMLDivElement>(null);
  // Find related post for Step
  const post = posts.find((obj) => obj.id === topic?.questions?.[0]);

  // Should not be the case
  if (!post) return null;

  const communityForecast = extractCommunityForecast(post);

  const handlePrediction = (type: "less" | "about" | "more") => {
    let initialPrediction: number;
    switch (type) {
      case "less":
        initialPrediction = Math.max(
          1,
          Math.round((communityForecast - 0.1) * 100)
        );
        break;
      case "about":
        initialPrediction = Math.round(communityForecast * 100);
        break;
      case "more":
        initialPrediction = Math.min(
          99,
          Math.round((communityForecast + 0.1) * 100)
        );
        break;
    }
    setPrediction(initialPrediction);
    setActiveButton(type);

    setTimeout(() => {
      endOfModalRef.current?.scrollIntoView({ behavior: "smooth" });
    }, 100);
  };

  const updateActiveButton = (newPrediction: number) => {
    const communityPrediction = communityForecast * 100;
    if (Math.abs(newPrediction - communityPrediction) <= 1) {
      setActiveButton("about");
    } else if (newPrediction < communityPrediction) {
      setActiveButton("less");
    } else {
      setActiveButton("more");
    }
  };

  const handleSubmit = async () => {
    if (prediction !== null) {
      sendAnalyticsEvent("onboardingPredicted1", {
        event_category: "onboarding",
      });
      setOnboardingState((obj) => ({
        ...obj,
        step2Prediction: prediction,
      }));
      onNext();
    }
  };

  return (
    <Step>
      <Step.Title>
        {t("onboardingStep2Title", { topicName: topic?.name })}
      </Step.Title>
      <Step.QuestionContainer>
        <Step.QuestionTitle>{post.title}</Step.QuestionTitle>
        {communityForecast !== undefined && (
          <Step.QuestionParagraph>
            {t("onboardingStep2CommunityThinks")}{" "}
            <VerbalForecast forecast={communityForecast} />.{" "}
            {t("onboardingStep2CommunityGives")}{" "}
            <span className="rounded bg-blue-700/20 px-1 py-0.5 font-semibold text-blue-800 dark:bg-blue-400/20 dark:text-blue-200">
              {(communityForecast * 100).toFixed(0)}%
            </span>
          </Step.QuestionParagraph>
        )}
      </Step.QuestionContainer>
      <p>
        {t("onboardingStep2WhatDoYouThink")}{" "}
        <span className="font-bold">
          {(communityForecast * 100).toFixed(0)}%
        </span>
        ? {t("onboardingStep2Disagree")}
      </p>
      <div className="flex justify-start gap-1.5 md:gap-3">
        <Step.Button
          onClick={() => handlePrediction("less")}
          className="w-full"
          variant={activeButton === "less" ? "active" : "primary"}
        >
          {t("onboardingStep2LessLikely")}
        </Step.Button>
        <Step.Button
          onClick={() => handlePrediction("about")}
          className="w-full"
          variant={activeButton === "about" ? "active" : "primary"}
        >
          {t("onboardingStep2AboutRight")}
        </Step.Button>
        <Step.Button
          onClick={() => handlePrediction("more")}
          className="w-full"
          variant={activeButton === "more" ? "active" : "primary"}
        >
          {t("onboardingStep2MoreLikely")}
        </Step.Button>
      </div>
      {prediction !== null && (
        <div className="mt-4">
          <div className="rounded-md bg-blue-200 py-4 dark:bg-blue-800">
            {activeButton && (
              <div className="flex flex-col items-center">
                <Step.Paragraph className="mb-5 px-5 text-center text-sm font-semibold">
                  {t("onboardingStep2Excellent")}
                </Step.Paragraph>
              </div>
            )}
            <BinarySlider
              forecast={prediction}
              onChange={(value) => {
                setPrediction(value);
                updateActiveButton(value);
              }}
              isDirty={true}
              communityForecast={communityForecast}
              onBecomeDirty={() => {}}
              disabled={false}
              helperDisplay={true}
            />
            <div className="mt-4 flex flex-col items-center">
              <Step.Button onClick={handleSubmit}>
                {t("onboardingStep2Predict")}
              </Step.Button>
            </div>
          </div>
        </div>
      )}
      <div ref={endOfModalRef} />
    </Step>
  );
};

export default Step1;
