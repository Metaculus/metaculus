import React from "react";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";

interface Step1Props {
  onTopicSelect: (topicIndex: number) => void;
}

const Step1: React.FC<Step1Props> = ({ onTopicSelect }) => (
  <div className={onboardingStyles.container}>
    <p className={onboardingStyles.title}>
      Should I bring an umbrella? What’s the market outlook? Will my team win
      today’s game?
    </p>
    <p className={onboardingStyles.paragraph}>
      You actually make predictions all the time, on topics big and small. It’s
      a skill, and Metaculus helps you hone it. 
    </p>
    <p className={onboardingStyles.paragraph}>
      Let’s make a few quick predictions to get you started.
    </p>
    <p className={onboardingStyles.paragraph}>
      First, pick a topic you care about.
    </p>
    <div className="mt-1 flex flex-row gap-3">
      {onboardingTopics.map((topic, index) => (
        <button
          key={index}
          onClick={() => onTopicSelect(index)}
          className={onboardingStyles.topic}
        >
          <p className="mb-0 pb-0 text-4xl">{topic.emoji}</p>
          {topic.name}
        </button>
      ))}
    </div>
  </div>
);

export default Step1;
