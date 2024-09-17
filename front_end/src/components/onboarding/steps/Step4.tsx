import React, { useState } from "react";
import { PostWithForecasts } from "@/types/post";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import { faArrowLeft, faPlus } from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import BinarySlider from "@/app/(main)/questions/[id]/components/forecast_maker/binary_slider";

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
  // Hardcoded community forecast for testing
  const communityForecast = 0.75; // 75%
  const factors = [...topic.factors, ...userFactors];

  const handleAddFactor = () => {
    if (newFactor.trim()) {
      setUserFactors([...userFactors, newFactor.trim()]);
      setNewFactor("");
    }
  };
  const handleSubmit = () => {
    console.log(`Submitted prediction: ${prediction / 100}`);
    onNext();
  };

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <p className={onboardingStyles.paragraph}>
        Let's refine your prediction.
      </p>
      <div className={onboardingStyles.questionContainer}>
        <h3 className="my-4 text-xl font-bold">{questionData.title}</h3>
      </div>
      <p className={onboardingStyles.paragraph}>
        Consider these factors that might influence the outcome:
      </p>
      <ul className="mb-4 list-none space-y-2">
        {factors.map((factor, index) => (
          <li
            key={index}
            className="rounded-sm bg-blue-400/75 p-2.5 text-sm dark:bg-blue-600/75"
          >
            {factor}
          </li>
        ))}
      </ul>
      <div className="mb-4 flex">
        <input
          type="text"
          value={newFactor}
          onChange={(e) => setNewFactor(e.target.value)}
          placeholder="You can add your own factor here if you like"
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
      <div className="mt-2">
        <div className="bg-blue-200 py-4 dark:bg-blue-800">
          <BinarySlider
            forecast={prediction}
            onChange={onPredictionChange}
            isDirty={true}
            communityForecast={communityForecast}
            onBecomeDirty={() => {}}
            disabled={false}
          />
        </div>
      </div>
      <div className="mt-6 flex justify-center">
        <button onClick={handleSubmit} className={onboardingStyles.button}>
          Continue
        </button>
      </div>
    </div>
  );
};

export default Step4;