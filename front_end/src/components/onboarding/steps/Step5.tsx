import React from "react";
import Link from "next/link";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import { faArrowLeft, faArrowRight } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Step5Props {
  onPrev: () => void;
  onNext: () => void;
  topicIndex: number | null;
}

const Step5: React.FC<Step5Props> = ({ onPrev, onNext, topicIndex }) => {
  if (topicIndex === null) {
    return <p>Error: No topic selected</p>;
  }

  const topic = onboardingTopics[topicIndex];
  const thirdQuestionId = topic.questions[2]; // Get the third question ID

  const questionUrl = `/questions/${thirdQuestionId}`;

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <h3 className={onboardingStyles.title}>Nice work!</h3>
      <p className={onboardingStyles.paragraph}>
        Anyone can improve at forecasting by practicing and thinking through
        what factors could influence outcomes.
      </p>
      <div className="flex flex-col gap-2 rounded-md bg-blue-200 p-3 dark:bg-blue-200-dark">
        <span className="block text-xs font-bold uppercase tracking-wide opacity-70">
          Did you know?
        </span>
        In a series of forecasting competitions conducted by University of
        Pennsylvania professor Philip Tetlock, skilled forecasters outperformed
        CIA analysts without access to classified intelligence.
      </div>
      <p className={onboardingStyles.paragraph}>
        <span className="font-bold">
          You are now ready to explore Metaculus by yourself. What would you
          like to do next?
        </span>{" "}
      </p>
      <div className="mx-auto flex w-full flex-col justify-stretch gap-4 md:flex-row ">
        <button className={`${onboardingStyles.smallButton} w-full md:w-fit`}>
          View Your Predictions
        </button>
        <Link href={questionUrl}>
          <button
            onClick={onNext}
            className={`${onboardingStyles.smallButton} w-full font-light md:w-fit`}
          >
            Forecast Another <span className="font-bold">{topic.name}</span>{" "}
            Question
          </button>
        </Link>

        <button className={`${onboardingStyles.smallButton} w-full md:w-fit`}>
          View Question Feed
        </button>
      </div>
    </div>
  );
};

export default Step5;
