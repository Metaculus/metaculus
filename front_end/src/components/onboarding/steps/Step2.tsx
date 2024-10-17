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
        return "Excellent. Below you can see your prediction quantified next to the community’s. Does that look about right? If not, you can grab and drag the slider. Click ‘Predict’ when you’re ready to continue.";
      case "about":
        return "Excellent. Below you can see your prediction quantified next to the community’s. Does that look about right? If not, you can grab and drag the slider. Click ‘Predict’ when you’re ready to continue.";
      case "more":
        return "Excellent. Below you can see your prediction quantified next to the community’s. Does that look about right? If not, you can grab and drag the slider. Click ‘Predict’ when you’re ready to continue.";
      default:
        return "";
    }
  };

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <p className={onboardingStyles.title}>
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
      <p>
        What do you think? Do you agree with{" "}
        <span className="font-bold">
          {(communityForecast * 100).toFixed(0)}%
        </span>
        ? Disagree?
      </p>
      <div className="flex justify-start gap-3">
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
            {activeButton && (
              <div className="flex flex-col items-center">
                <p
                  className={`${onboardingStyles.paragraph} mb-5 px-5 text-center text-sm font-semibold`}
                >
                  {getActiveButtonText()}
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
              >
                Predict
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Step2;
