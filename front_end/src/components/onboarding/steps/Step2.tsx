import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendGAEvent } from "@next/third-parties/google";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import React, { useState, useRef } from "react";

import BinarySlider, {
  BINARY_FORECAST_PRECISION,
} from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import { createForecasts } from "@/app/(main)/questions/actions";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { PostWithForecasts } from "@/types/post";

import LoadingStep from "./LoadingStep";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import VerbalForecast from "../VerbalForecast";

interface Step2Props {
  onPrev: () => void;
  onNext: () => void;
  topicIndex: number | null;
  questionData: PostWithForecasts | null;
  onPredictionChange: (value: number) => void;
}

const Step2: React.FC<Step2Props> = ({
  onPrev,
  onNext,
  topicIndex,
  questionData,
  onPredictionChange,
}) => {
  const t = useTranslations();
  const [prediction, setPrediction] = useState<number | null>(null);
  const [activeButton, setActiveButton] = useState<
    "less" | "about" | "more" | null
  >(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  const endOfModalRef = useRef<HTMLDivElement>(null);

  if (topicIndex === null || !questionData || !questionData.question) {
    return <LoadingStep />;
  }
  const topic = onboardingTopics[topicIndex];
  const communityForecast =
    questionData.question?.aggregations?.recency_weighted?.latest
      ?.centers?.[0] ?? 0.5;
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
    if (prediction === null || !questionData || !questionData.question) return;

    setIsSubmitting(true);
    setSubmitError(null);

    const forecastValue = round(prediction / 100, BINARY_FORECAST_PRECISION);

    try {
      const response = await createForecasts(questionData.id, [
        {
          questionId: questionData.question.id,
          forecastData: {
            continuousCdf: null,
            probabilityYes: forecastValue,
            probabilityYesPerCategory: null,
          },
        },
      ]);

      if (response && "errors" in response && !!response.errors) {
        throw new Error(response.errors[0].message);
      }
      sendGAEvent({
        event: "onboardingPredicted1",
        event_category: "onboarding",
      });

      onPredictionChange(prediction);
      onNext();
    } catch (error) {
      console.error("Error submitting forecast:", error);
      setSubmitError(
        error instanceof Error
          ? error.message
          : "An error occurred while submitting your forecast."
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const getButtonClass = (buttonType: "less" | "about" | "more") => {
    return `${onboardingStyles.button} ${
      activeButton === buttonType
        ? "w-full bg-blue-700 hover:bg-blue-800 text-white dark:text-blue-800 dark:bg-white"
        : "w-full"
    }`;
  };

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <p className={onboardingStyles.title}>
        {t("onboardingStep2Title", { topicName: topic.name })}
      </p>
      <div className={onboardingStyles.questionContainer}>
        <h3 className={onboardingStyles.questionTitle}>{questionData.title}</h3>
        {communityForecast !== undefined && (
          <p className={onboardingStyles.largeparagraph}>
            {t("onboardingStep2CommunityThinks")}{" "}
            <VerbalForecast forecast={communityForecast} />.{" "}
            {t("onboardingStep2CommunityGives")}{" "}
            <span className="rounded bg-blue-700/20 px-1 py-0.5 font-semibold text-blue-800 dark:bg-blue-400/20 dark:text-blue-200">
              {(communityForecast * 100).toFixed(0)}%
            </span>
          </p>
        )}
      </div>
      <p>
        {t("onboardingStep2WhatDoYouThink")}{" "}
        <span className="font-bold">
          {(communityForecast * 100).toFixed(0)}%
        </span>
        ? {t("onboardingStep2Disagree")}
      </p>
      <div className="flex justify-start gap-1.5 md:gap-3">
        <button
          onClick={() => handlePrediction("less")}
          className={getButtonClass("less")}
        >
          {t("onboardingStep2LessLikely")}
        </button>
        <button
          onClick={() => handlePrediction("about")}
          className={getButtonClass("about")}
        >
          {t("onboardingStep2AboutRight")}
        </button>
        <button
          onClick={() => handlePrediction("more")}
          className={getButtonClass("more")}
        >
          {t("onboardingStep2MoreLikely")}
        </button>
      </div>
      {prediction !== null && (
        <div className="mt-4">
          <div className="rounded-md bg-blue-200 py-4 dark:bg-blue-800">
            {activeButton && (
              <div className="flex flex-col items-center">
                <p
                  className={`${onboardingStyles.paragraph} mb-5 px-5 text-center text-sm font-semibold`}
                >
                  {t("onboardingStep2Excellent")}
                </p>
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
              <button
                onClick={handleSubmit}
                className={onboardingStyles.button}
                disabled={isSubmitting}
              >
                {isSubmitting ? (
                  <LoadingIndicator />
                ) : (
                  t("onboardingStep2Predict")
                )}
              </button>
              {submitError && (
                <p className="mt-2 text-red-500">
                  {submitError || t("onboardingStep2Error")}
                </p>
              )}
            </div>
          </div>
        </div>
      )}
      <div ref={endOfModalRef} /> {/* Add this line */}
    </div>
  );
};

export default Step2;
