import React, { useState } from "react";
import { PostWithForecasts } from "@/types/post";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import { faArrowLeft, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";

interface Step4Props {
  onPrev: () => void;
  onNext: () => void;
  topicIndex: number | null;
  questionData: PostWithForecasts | null;
  prediction: number;
  onPredictionChange: (value: number) => void;
}

const Step4: React.FC<Step4Props> = ({
  onPrev,
  onNext,
  topicIndex,
  questionData,
  prediction,
  onPredictionChange,
}) => {
  const [newFactor, setNewFactor] = useState("");
  const [userFactors, setUserFactors] = useState<string[]>([]);

  if (topicIndex === null || !questionData) {
    return <p>Loading...</p>;
  }

  const topic = onboardingTopics[topicIndex];
  const factors = [...topic.factors, ...userFactors];

  const handleAddFactor = () => {
    if (newFactor.trim()) {
      setUserFactors([...userFactors, newFactor.trim()]);
      setNewFactor("");
    }
  };

  const handleSliderChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    onPredictionChange(Number(event.target.value));
  };

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <h3 className={onboardingStyles.heading}>Let's refine your prediction</h3>
      <div className={onboardingStyles.questionContainer}>
        <h3 className="my-4 text-xl font-bold">{questionData.title}</h3>
      </div>
      <p className={onboardingStyles.paragraph}>
        Consider these factors that might influence the outcome:
      </p>
      <ul className="mb-4 list-disc pl-5">
        {factors.map((factor, index) => (
          <li key={index} className={onboardingStyles.paragraph}>
            {factor}
          </li>
        ))}
      </ul>
      <div className="mb-4 flex">
        <input
          type="text"
          value={newFactor}
          onChange={(e) => setNewFactor(e.target.value)}
          placeholder="Add your own factor"
          className={onboardingStyles.input}
        />
        <button
          onClick={handleAddFactor}
          className={onboardingStyles.smallButton}
        >
          <FontAwesomeIcon icon={faPlus} />
        </button>
      </div>
      <p className={onboardingStyles.paragraph}>
        Now, considering these factors, how would you adjust your prediction?
      </p>
      <div className="my-6">
        <input
          type="range"
          min="1"
          max="99"
          value={prediction}
          onChange={handleSliderChange}
          className="w-full"
        />
        <p className="mt-2 text-center">Your prediction: {prediction}%</p>
      </div>
      <div className="mt-6 flex justify-center">
        <button onClick={onNext} className={onboardingStyles.button}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default Step4;
