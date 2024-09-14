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
  const [showSlider, setShowSlider] = useState(false);
  const [prediction, setPrediction] = useState<number | null>(null);
  const [activeButton, setActiveButton] = useState<
    "less" | "about" | "more" | null
  >(null);
  useEffect(() => {
    if (prediction !== null) {
      updateActiveButton(prediction);
    }
  }, [prediction]);
  if (topicIndex === null || !questionData) {
    return <p>Loading...</p>;
  }
  const topic = onboardingTopics[topicIndex];
  const communityForecast = 0.75; // Hardcoded for testing to be replaced with line below
  // const communityForecast = questionData.question?.aggregations?.recency_weighted?.latest?.centers?.[0];

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
    setShowSlider(true);
    setActiveButton(type);
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const newPrediction = Number(event.target.value);
    setPrediction(newPrediction);
    updateActiveButton(newPrediction);
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
        return "You think it's less likely than the community.";
      case "about":
        return "You agree with the community prediction.";
      case "more":
        return "You think it's more likely than the community.";
      default:
        return "";
    }
  };

  const calculateChevronPosition = (percentage: number) => {
    // Ensure the percentage is between 0 and 100
    const clampedPercentage = Math.max(0, Math.min(100, percentage));
    return `${clampedPercentage}%`;
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
        <h3 className="my-4 text-xl font-bold">{questionData.title}</h3>
        {communityForecast !== undefined && (
          <p className={onboardingStyles.paragraph}>
            Other forecasters tend to think this is{" "}
            <span className="text-blue-800 dark:text-blue-300">XXX</span>. They
            give it{" "}
            <span className="rounded bg-blue-700 p-1 font-semibold text-white">
              {(communityForecast * 100).toFixed(2)}%
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

      {showSlider && prediction !== null && (
        <div className="relative mt-16">
          <div
            className="absolute top-[-36px] flex flex-col"
            style={{
              left: calculateChevronPosition(communityForecast * 100),
              transform: "translateX(-50%)",
            }}
          >
            <span>Community</span>
            <FontAwesomeIcon icon={faChevronDown} />
          </div>
          <input
            type="range"
            min="1"
            max="99"
            value={prediction}
            onChange={handleSliderChange}
            className="w-full"
          />
          <div
            className="absolute flex flex-col"
            style={{
              left: calculateChevronPosition(prediction),
              transform: "translateX(-50%)",
            }}
          >
            <FontAwesomeIcon icon={faChevronUp} />
            <span>Me</span>
          </div>
          {activeButton && (
            <p
              className={`${onboardingStyles.paragraph} mt-8 text-center font-semibold`}
            >
              {getActiveButtonText()}
            </p>
          )}
          <div className="mt-4 flex flex-col items-center gap-3">
            <span>Your Prediction: {prediction}%</span>
            <button onClick={handleSubmit} className={onboardingStyles.button}>
              Submit Prediction
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2;
