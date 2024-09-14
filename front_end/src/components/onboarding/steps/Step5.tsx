import React from "react";
import Link from "next/link";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import { faArrowLeft } from "@fortawesome/free-solid-svg-icons";
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
      <h3 className={onboardingStyles.heading}>
        Great job on your predictions!
      </h3>
      <p className={onboardingStyles.paragraph}>
        You're ready to explore more questions on Metaculus. Let's take a look
        at another question about {topic.name}.
      </p>
      <p className={onboardingStyles.paragraph}>
        Click the button below to view the question and start a guided tour of
        the question page.
      </p>
      <div className="flex justify-between">
        <Link href={questionUrl}>
          <button onClick={onNext} className={onboardingStyles.button}>
            View Question and Start Tour
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Step5;
