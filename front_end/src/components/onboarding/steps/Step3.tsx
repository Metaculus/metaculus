import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { useTranslations } from "next-intl";
import React from "react";

import BinarySlider from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import LoadingIndicator from "@/components/ui/loading_indicator";
import { PostWithForecasts } from "@/types/post";

import LoadingStep from "./LoadingStep";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import VerbalForecast from "../VerbalForecast";

interface Step3Props {
  onPrev: () => void;
  onNext: () => void;
  topicIndex: number | null;
  questionData: PostWithForecasts | null;
  prediction: number;
  onPredictionChange: (value: number) => void;
  isLoading?: boolean;
}

const Step3: React.FC<Step3Props> = ({
  onPrev,
  onNext,
  topicIndex,
  questionData,
  prediction,
  onPredictionChange,
  isLoading = false,
}) => {
  const t = useTranslations();

  if (topicIndex === null || !questionData) {
    return <LoadingStep />;
  }

  const topic = onboardingTopics[topicIndex];
  const communityForecast =
    questionData.question?.aggregations?.recency_weighted?.latest
      ?.centers?.[0] ?? 0.5;

  const handleSubmit = () => {
    onNext();
  };

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <p className={onboardingStyles.title}>
        {t("onboardingStep3Title", { topicName: topic.name })}
      </p>
      <div className={onboardingStyles.questionContainer}>
        {isLoading ? (
          <div className="flex h-32 items-center justify-center">
            <LoadingIndicator />
          </div>
        ) : (
          <>
            <h3 className={onboardingStyles.questionTitle}>
              {questionData.title}
            </h3>
            {communityForecast !== undefined && (
              <p className={onboardingStyles.largeparagraph}>
                {t("onboardingStep3CommunityThinks")}{" "}
                <VerbalForecast forecast={communityForecast} />.{" "}
                {t("onboardingStep3CommunityGives")}{" "}
                <span className="rounded bg-blue-700/20 px-1 py-0.5 font-semibold text-blue-800 dark:bg-blue-400/20 dark:text-blue-200">
                  {(communityForecast * 100).toFixed(0)}%
                </span>
              </p>
            )}
          </>
        )}
      </div>
      <p>{t("onboardingStep3WhatDoYouThink")}</p>
      <div className="rounded-md bg-blue-200 py-4 dark:bg-blue-800">
        <BinarySlider
          forecast={prediction}
          onChange={onPredictionChange}
          isDirty={true}
          communityForecast={communityForecast}
          onBecomeDirty={() => {}}
          disabled={false}
          helperDisplay={true}
        />
        <div className="mt-6 flex justify-center">
          <button onClick={handleSubmit} className={onboardingStyles.button}>
            {t("onboardingStep3Predict")}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Step3;
