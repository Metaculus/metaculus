import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { sendGAEvent } from "@next/third-parties/google";
import { round } from "lodash";
import { useTranslations } from "next-intl";
import React, { useState } from "react";

import BinarySlider, {
  BINARY_FORECAST_PRECISION,
} from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import { createForecasts } from "@/app/(main)/questions/actions";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { PostWithForecasts } from "@/types/post";

import LoadingStep from "./LoadingStep";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";

interface Step4Props {
  onPrev: () => void;
  onNext: () => void;
  topicIndex: number | null;
  questionData: PostWithForecasts | null;
  prediction: number;
  onPredictionChange: (value: number) => void;
}

const Step4: React.FC<Step4Props> = ({
  onPrev,
  onNext,
  topicIndex,
  questionData,
  prediction,
  onPredictionChange,
}) => {
  const t = useTranslations();
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (topicIndex === null || !questionData || !questionData.question) {
    return <LoadingStep />;
  }

  const topic = onboardingTopics[topicIndex];
  const communityForecast =
    questionData.question?.aggregations?.recency_weighted?.latest
      ?.centers?.[0] ?? 0.5;
  const factors = [...topic.factors];

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
        event: "onboardingPredicted2",
        event_category: "onboarding",
      });

      onNext();
    } catch (error) {
      console.error("Error submitting forecast:", error);
      setSubmitError(
        error instanceof Error ? error.message : t("onboardingStep4Error")
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <p className={onboardingStyles.title}>{t("onboardingStep4Factors")}</p>
      <div>
        <ul className="list-none space-y-2">
          {factors.map((factor, index) => (
            <li
              key={index}
              className="flex flex-row items-center justify-between gap-4 rounded-md bg-purple-400/45 p-2.5 px-4 text-sm dark:bg-purple-600/25 md:text-base"
            >
              {factor}
            </li>
          ))}
        </ul>
      </div>
      <p className={onboardingStyles.paragraph}>
        {t("onboardingStep4ConsideringOthers")}
      </p>
      <p className={onboardingStyles.paragraph}>
        {t("onboardingStep4WhatDoYouThink")}
      </p>
      <div className="flex flex-col gap-1 rounded-md bg-blue-200 dark:bg-blue-800">
        <div
          className={`${onboardingStyles.questionContainer} rounded-none border-none py-1 pb-0`}
        >
          <h3 className={`${onboardingStyles.questionTitle} mb-0 px-2 pb-0`}>
            {questionData.title}
          </h3>
        </div>
        <div>
          <div className="py-4">
            <BinarySlider
              forecast={prediction}
              onChange={onPredictionChange}
              isDirty={true}
              communityForecast={communityForecast}
              onBecomeDirty={() => {}}
              disabled={false}
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
                  t("onboardingStep4Predict")
                )}
              </button>
              {submitError && (
                <p className="mt-2 text-red-500">{submitError}</p>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4;
