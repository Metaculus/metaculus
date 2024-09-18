import React, { useState, useEffect } from "react";
import { PostWithForecasts } from "@/types/post";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import {
  faArrowLeft,
  faChevronDown,
  faChevronUp,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BinarySlider, {
  BINARY_FORECAST_PRECISION,
} from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";
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
  const [prediction, setPrediction] = useState<number | null>(null);
  const [activeButton, setActiveButton] = useState<
    "less" | "about" | "more" | null
  >(null);

  if (topicIndex === null || !questionData) {
    return <p>Loading...</p>;
  }
  const topic = onboardingTopics[topicIndex];
  // const communityForecast = 0.55; // Hardcoded for testing to be replaced with line below
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

  const handleSubmit = () => {
    if (prediction !== null) {
      console.log(`Submitted prediction: ${prediction / 100}`);
      onPredictionChange(prediction);
      onNext();
    }
  };

  const getButtonClass = (buttonType: "less" | "about" | "more") => {
    return `${onboardingStyles.button} ${
      activeButton === buttonType
        ? "bg-blue-700 hover:bg-blue-800 text-white dark:text-blue-800 dark:bg-white"
        : ""
    }`;
  };

  const getActiveButtonText = () => {
    switch (activeButton) {
      case "less":
        return "You can adjust your prediction with the above slider if you like. Click 'Predict' when you're ready to move on.'";
      case "about":
        return "You can adjust your prediction with the above slider if you like. Click 'Predict' when you're ready to move on.'";
      case "more":
        return "You can adjust your prediction with the above slider if you like. Click 'Predict' when you're ready to move on.'";
      default:
        return "";
    }
  };

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <p className={onboardingStyles.paragraph}>
        Here's a real Metaculus question about {topic.name}:
      </p>
      <div className={onboardingStyles.questionContainer}>
        <h3 className={onboardingStyles.questionTitle}>{questionData.title}</h3>
        {communityForecast !== undefined && (
          <p className={onboardingStyles.largeparagraph}>
            Other forecasters tend to think this is{" "}
            <VerbalForecast forecast={communityForecast} />. They give it{" "}
            <span className="rounded bg-blue-700/20 px-1 py-0.5 font-semibold text-blue-800 dark:bg-blue-400/20 dark:text-blue-200">
              {(communityForecast * 100).toFixed(0)}%
            </span>
          </p>
        )}
      </div>
      <p>What do you think? Is it more likely than that? Less? About right?</p>
      <div className="mt-6 flex justify-start gap-3">
        <button
          onClick={() => handlePrediction("less")}
          className={getButtonClass("less")}
        >
          Less likely
        </button>
        <button
          onClick={() => handlePrediction("about")}
          className={getButtonClass("about")}
        >
          About right
        </button>
        <button
          onClick={() => handlePrediction("more")}
          className={getButtonClass("more")}
        >
          More likely
        </button>
      </div>

      {prediction !== null && (
        <div className="mt-4">
          <div className="bg-blue-200 py-4 dark:bg-blue-800">
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
            />
            {/* <div className="flex px-[25px] w-full justify-between relative top-[-112px] text-xs text-gray-500 dark:text-gray-500">
              <span className="w-full text-left">Very Unlikely</span>
              <span className="w-full text-center">About Even</span>
              <span className="w-full text-right">Very Likely</span>
            </div> */}
            {activeButton && (
              <div className="mt-[-4px] text-center">
                <div className="w-full animate-bounce self-center text-center opacity-50">
                  <FontAwesomeIcon icon={faChevronUp} />
                </div>
                <span className="mt-[-4px] block">Me</span>
              </div>
            )}
          </div>
          <div className="flex flex-col items-center">
            <p
              className={`${onboardingStyles.paragraph} mb-0 pb-0 text-center font-semibold`}
            >
              {getActiveButtonText()}
            </p>
            <button onClick={handleSubmit} className={onboardingStyles.button}>
              Predict
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2;
