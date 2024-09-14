import React from "react";
import { PostWithForecasts } from "@/types/post";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Step2Props {
  onPrev: () => void;
  onNext: () => void;
  topicIndex: number | null;
  questionData: PostWithForecasts | null;
}

const Step2: React.FC<Step2Props> = ({
  onPrev,
  onNext,
  topicIndex,
  questionData,
}) => {
  if (topicIndex === null || !questionData) {
    return <p>Loading...</p>;
  }

  const topic = onboardingTopics[topicIndex];
  const communityForecast = 0.75; // Hardcoded for testing to be replaced with line below
  // const communityForecast = questionData.question?.aggregations?.recency_weighted?.latest?.centers?.[0];

  const handlePrediction = (type: "less" | "about" | "more") => {
    let prediction: number;
    if (communityForecast !== undefined) {
      switch (type) {
        case "less":
          prediction = Math.max(0.001, communityForecast - 0.1);
          break;
        case "about":
          prediction = communityForecast;
          break;
        case "more":
          prediction = Math.min(0.999, communityForecast + 0.1);
          break;
      }
      // TODO: Implement actual prediction submission
      console.log(`Submitted prediction: ${prediction}`);
      onNext();
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
          className={onboardingStyles.button}
        >
          Less likely
        </button>
        <button
          onClick={() => handlePrediction("about")}
          className={onboardingStyles.button}
        >
          About right
        </button>
        <button
          onClick={() => handlePrediction("more")}
          className={onboardingStyles.button}
        >
          More likely
        </button>
      </div>
    </div>
  );
};

export default Step2;
