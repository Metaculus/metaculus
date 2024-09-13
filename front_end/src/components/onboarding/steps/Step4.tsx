import React from "react";
import Link from "next/link";
import { onboardingTopics } from "../OnboardingSettings";

interface Step4Props {
  onPrev: () => void;
  onNext: () => void;
  topicIndex: number | null;
}

const Step4: React.FC<Step4Props> = ({ onPrev, onNext, topicIndex }) => {
  if (topicIndex === null) {
    return <p>Error: No topic selected</p>;
  }

  const topic = onboardingTopics[topicIndex];
  const thirdQuestionId = topic.questions[2]; // Get the third question ID

  const questionUrl = `/questions/${thirdQuestionId}?tour=guided`;

  return (
    <div className="w-[560px]">
      <h3 className="mb-4 text-xl font-bold">Great job on your predictions!</h3>
      <p className="mb-4">
        You're ready to explore more questions on Metaculus. Let's take a look
        at another question about {topic.name}.
      </p>
      <p className="mb-6">
        Click the button below to view the question and start a guided tour of
        the question page.
      </p>
      <div className="flex justify-between">
        <button
          onClick={onPrev}
          className="rounded bg-gray-300 px-4 py-2 hover:bg-gray-400"
        >
          Back
        </button>
        <Link href={questionUrl}>
          <button
            onClick={onNext}
            className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
          >
            View Question and Start Tour
          </button>
        </Link>
      </div>
    </div>
  );
};

export default Step4;
