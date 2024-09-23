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
  // const communityForecast = 0.55; // Hardcoded for testing to be replaced with line below
  const communityForecast =
    questionData.question?.aggregations?.recency_weighted?.latest
      ?.centers?.[0] ?? 0.5;
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
      <p className={onboardingStyles.title}>
        This time let's think through things that might influence the outcome.
      </p>
      <ul className="mb-4 list-none space-y-2">
        {factors.map((factor, index) => (
          <li
            key={index}
            className="rounded-md bg-blue-400/45 p-2.5 text-base dark:bg-blue-600/25"
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
        What do you think? Did any of those factors make you want to change your
        prediction? If not, that's fine too.
      </p>
      <div className="flex flex-col gap-1 bg-blue-200 dark:bg-blue-800">
        <div
          className={`${onboardingStyles.questionContainer} rounded-none border-none py-1 pb-0`}
        >
          <h3 className={`${onboardingStyles.questionTitle} mb-0 px-2 pb-0`}>
            {questionData.title}
          </h3>{" "}
        </div>
        <div>
          <div className="py-4">
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
      </div>
      <div className="mt-6 flex justify-center">
        <button onClick={handleSubmit} className={onboardingStyles.button}>
          Predict
        </button>
      </div>
    </div>
  );
};

export default Step4;
