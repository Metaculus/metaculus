import React from "react";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";

interface Step1Props {
  onTopicSelect: (topicIndex: number) => void;
  onClose: () => void;
}

const Step1: React.FC<Step1Props> = ({ onTopicSelect, onClose }) => (
  <div className="mt-[-16px] max-w-[800px] flex-row gap-3 p-0 md:flex-col md:p-5">
    <p className="my-2 mt-4 text-left text-xl font-semibold leading-relaxed text-blue-800  dark:text-blue-200  md:text-2xl ">
      <span className="opacity-60">“</span>Should I bring an umbrella?
      <span className="opacity-60">“</span> <br />
      <span className="opacity-60">
        <span className="opacity-60">“</span>Are we headed for a recession?
        <span className="opacity-60">“</span>{" "}
      </span>
      <br />
      <span className="opacity-30">
        <span className="opacity-60">“</span>Will my team come out on top?
        <span className="opacity-50">“</span>
      </span>
    </p>
    <div className="my-4">
      <p className={onboardingStyles.paragraph}>
        You make predictions all the time, on topics big and small. It’s a
        skill, and Metaculus helps you hone it.
      </p>
      <p className={onboardingStyles.paragraph}>
        Let’s make a few quick predictions to get you started.
      </p>
      <p className={onboardingStyles.paragraph}>
        First, pick a topic you care about.
      </p>
    </div>
    <div className="mt-1 flex w-full flex-col gap-2 md:flex-row md:gap-3">
      {onboardingTopics.map((topic, index) => (
        <button
          key={index}
          onClick={() => onTopicSelect(index)}
          className={onboardingStyles.topic}
        >
          <span className="text-xl md:text-4xl md:leading-none">
            {topic.emoji}
          </span>
          {topic.name}
        </button>
      ))}
    </div>
    <button
      onClick={onClose}
      className="mt-4 text-base text-blue-700 underline decoration-blue-700/70 underline-offset-4 hover:text-blue-800 hover:decoration-blue-700/90 dark:text-blue-700-dark dark:decoration-blue-700/70 dark:hover:text-blue-800-dark dark:hover:decoration-blue-700-dark/90 "
    >
      Skip Tutorial
    </button>
  </div>
);

export default Step1;
