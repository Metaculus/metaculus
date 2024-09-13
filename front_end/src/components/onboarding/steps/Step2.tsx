import React from "react";
import { PostWithForecasts } from "@/types/post";
import { onboardingTopics } from "../OnboardingSettings";

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
    <div className="w-[560px]">
      <p>Here's a real Metaculus question about {topic.name}:</p>
      <h3 className="my-4 text-xl font-bold">{questionData.title}</h3>
      {communityForecast !== undefined && (
        <p className="mb-4">
          Community prediction: {(communityForecast * 100).toFixed(2)}%
        </p>
      )}
      <p>What do you think? Is it more likely than that? Less? About right?</p>
      <div className="mt-6 flex justify-between">
        <button
          onClick={() => handlePrediction("less")}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          Less likely
        </button>
        <button
          onClick={() => handlePrediction("about")}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          About right
        </button>
        <button
          onClick={() => handlePrediction("more")}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          More likely
        </button>
      </div>
      <div className="mt-6 flex justify-between">
        <button
          onClick={onPrev}
          className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
        >
          Back
        </button>
      </div>
    </div>
  );
};

export default Step2;
