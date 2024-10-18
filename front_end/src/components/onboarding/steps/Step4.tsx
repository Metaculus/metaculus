import React, { useState } from "react";
import { PostWithForecasts } from "@/types/post";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import { faArrowLeft, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BinarySlider, {
  BINARY_FORECAST_PRECISION,
} from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
import LoadingStep from "./LoadingStep";
import { createForecasts } from "@/app/(main)/questions/actions";
import { round } from "lodash";
import LoadingIndicator from "@/components/ui/loading_indicator";

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
  const [newFactor, setNewFactor] = useState("");
  const [userFactors, setUserFactors] = useState<string[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);

  if (topicIndex === null || !questionData || !questionData.question) {
    return <LoadingStep />;
  }

  const topic = onboardingTopics[topicIndex];
  const communityForecast =
    questionData.question?.aggregations?.recency_weighted?.latest
      ?.centers?.[0] ?? 0.5;
  const factors = [...topic.factors, ...userFactors];

  const handleAddFactor = () => {
    if (newFactor.trim()) {
      setUserFactors([...userFactors, newFactor.trim()]);
      setNewFactor("");
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

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <p className={onboardingStyles.title}>
        Here are some of the factors other forecasters are considering.
      </p>
      <div>
        <ul className="mb-4 list-none space-y-2">
          {factors.map((factor, index) => (
            <li
              key={index}
              className="flex flex-row items-center justify-between gap-4 rounded-md bg-purple-400/45 p-2.5 px-4 text-sm dark:bg-purple-600/25 md:text-base"
            >
              {factor}
            </li>
          ))}
        </ul>
        <div className="flex">
          <input
            type="text"
            value={newFactor}
            onChange={(e) => setNewFactor(e.target.value)}
            placeholder="Add your own factors here"
            className={onboardingStyles.input}
          />
          <button
            onClick={handleAddFactor}
            className={`${onboardingStyles.smallButton} ${newFactor.trim() === "" ? "cursor-not-allowed opacity-35" : ""}`}
            disabled={newFactor.trim() === ""}
          >
            <FontAwesomeIcon icon={faPlus} /> Add
          </button>
        </div>
      </div>
      <p className={onboardingStyles.paragraph}>
        Considering others' views is an important step in forecasting
        accurately!
      </p>
      <p className={onboardingStyles.paragraph}>
        What do you think? Did any of those factors make you want to change your
        prediction? If not, that's fine too.
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
                {isSubmitting ? <LoadingIndicator /> : "Predict"}
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
