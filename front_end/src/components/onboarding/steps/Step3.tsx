import React, { useState } from "react";
import { PostWithForecasts } from "@/types/post";
import { onboardingTopics } from "../OnboardingSettings";

interface Step3Props {
  onPrev: () => void;
  onNext: () => void;
  topicIndex: number | null;
  questionData: PostWithForecasts | null;
}

const Step3: React.FC<Step3Props> = ({
  onPrev,
  onNext,
  topicIndex,
  questionData,
}) => {
  const [prediction, setPrediction] = useState(50);

  if (topicIndex === null || !questionData) {
    return <p>Loading...</p>;
  }

  const topic = onboardingTopics[topicIndex];
  // Hardcoded community forecast for testing
  const communityForecast = 0.75; // 75%

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    setPrediction(Number(event.target.value));
  };

  const handleSubmit = () => {
    console.log(`Submitted prediction: ${prediction / 100}`);
    onNext();
  };

  return (
    <div className="w-[560px]">
      <p>Great! Here's another question about {topic.name}:</p>
      <h3 className="my-4 text-xl font-bold">{questionData.title}</h3>
      <p className="mb-4">
        Community prediction: {(communityForecast * 100).toFixed(2)}%
      </p>
      <p>How likely do you think this is?</p>
      <div className="my-6">
        <input
          type="range"
          min="1"
          max="99"
          value={prediction}
          onChange={handleSliderChange}
          className="w-full"
        />
        <p className="mt-2 text-center">Your prediction: {prediction}%</p>
      </div>
      <div className="mt-6 flex justify-between">
        <button
          onClick={onPrev}
          className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
        >
          Back
        </button>
        <button
          onClick={handleSubmit}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Continue
        </button>
      </div>
    </div>
  );
};

export default Step3;
