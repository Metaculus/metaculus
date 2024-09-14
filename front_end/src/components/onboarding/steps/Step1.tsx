import React from "react";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";

interface Step1Props {
  onTopicSelect: (topicIndex: number) => void;
}

const Step1: React.FC<Step1Props> = ({ onTopicSelect }) => (
  <div className={onboardingStyles.container}>
    <p className={onboardingStyles.paragraph}>
      Will it rain today? Will this stock go up? Will my team win? You actually
      make predictions all the time, on topics big and small. It’s a skill, and
      Metaculus helps you hone it. 
    </p>
    <p className={onboardingStyles.paragraph}>
      Let’s make a few quick predictions to get you started.
    </p>
    <hr className={onboardingStyles.divider} />
    <p className={onboardingStyles.largeparagraph}>
      Pick a topic you care about.
    </p>
    <div className="mt-6 flex flex-row gap-3">
      {onboardingTopics.map((topic, index) => (
        <button
          key={index}
          onClick={() => onTopicSelect(index)}
          className={onboardingStyles.button}
        >
          {topic.name}
        </button>
      ))}
    </div>
  </div>
);

export default Step1;
