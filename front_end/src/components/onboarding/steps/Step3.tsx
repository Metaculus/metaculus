import React from "react";
import { PostWithForecasts } from "@/types/post";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BinarySlider from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";

interface Step3Props {
  onPrev: () => void;
  onNext: () => void;
  topicIndex: number | null;
  questionData: PostWithForecasts | null;
  prediction: number;
  onPredictionChange: (value: number) => void;
}

const Step3: React.FC<Step3Props> = ({
  onPrev,
  onNext,
  topicIndex,
  questionData,
  prediction,
  onPredictionChange,
}) => {
  if (topicIndex === null || !questionData) {
    return <p>Loading...</p>;
  }

  const topic = onboardingTopics[topicIndex];
  // Hardcoded community forecast for testing
  const communityForecast = 0.75; // 75%

  const handleSubmit = () => {
    console.log(`Submitted prediction: ${prediction / 100}`);
    onNext();
  };

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <p className={onboardingStyles.paragraph}>
        Great! Here's another question about {topic.name}:
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
      <p>How likely do you think this is?</p>
      <div className="mt-2">
        <div className="bg-blue-200 py-4 dark:bg-blue-800">
          <BinarySlider
            forecast={prediction}
            onChange={onPredictionChange}
            isDirty={true}
            communityForecast={communityForecast}
            onBecomeDirty={() => {}}
            disabled={false}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <button onClick={handleSubmit} className={onboardingStyles.button}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default Step3;
