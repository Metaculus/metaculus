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
        what factors could influence outcomes. In a series of forecasting
        competitions conducted by University of Pennsylvania professor Philip
        Tetlock, skilled forecasters outperformed CIA analysts without access to
        classified intelligence.
      </p>
      <p className={onboardingStyles.paragraph}>
        <span className="font-bold">
          You are now ready to explore Metaculus by yourself. What would you
          like to do next?
        </span>{" "}
      </p>
      <div className="mx-auto flex w-full flex-col justify-stretch gap-4 md:flex-row ">
        <Link href="/questions/" replace scroll={true}>
          <button className={`${onboardingStyles.button} w-full`}>
            View Question Feed
          </button>
        </Link>
        <Link href={questionUrl}>
          <button
            onClick={onNext}
            className={`${onboardingStyles.button} w-full font-light`}
          >
            View Another <span className="font-bold">{topic.name}</span>{" "}
            Question
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Step5;
