import React from "react";
import { onboardingTopics } from "../OnboardingSettings";

interface Step1Props {
  onTopicSelect: (topicIndex: number) => void;
}

const Step1: React.FC<Step1Props> = ({ onTopicSelect }) => (
  <div className="w-[560px]">
    <p>
      Welcome to Metaculus! Let's start by choosing a topic you're interested
      in:
    </p>
    <div className="mt-4 grid grid-cols-2 gap-4">
      {onboardingTopics.map((topic, index) => (
        <button
          key={index}
          onClick={() => onTopicSelect(index)}
          className="rounded bg-blue-500 p-4 text-white transition-colors hover:bg-blue-600"
        >
          {topic.name}
        </button>
      ))}
    </div>
  </div>
);

export default Step1;
