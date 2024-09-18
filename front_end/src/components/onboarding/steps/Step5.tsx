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

  const questionUrl = `/questions/${thirdQuestionId}?tour=guided`;

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <h3 className={onboardingStyles.heading}>Nice work.</h3>
      <p className={onboardingStyles.paragraph}>
        Anyone can improve at forecasting by practicing and thinking through
        what factors could influence outcomes. In a series of forecasting
        competitions conducted by University of Pennsylvania professor Philip
        Tetlock, skilled forecasters outperformed CIA analysts with access to
        classified intelligence.
      </p>
      <p className={onboardingStyles.paragraph}>
        Next we'll bring it all together so you can forecast on a real Metaculus
        question page.
      </p>
      <div className="mx-auto flex justify-center ">
        <Link href={questionUrl}>
          <button
            onClick={onNext}
            className={`${onboardingStyles.button} text-xl`}
          >
            <FontAwesomeIcon icon={faArrowRight} />
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Step5;
