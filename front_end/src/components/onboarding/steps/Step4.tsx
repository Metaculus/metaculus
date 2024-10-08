import React, { useState } from "react";
import { PostWithForecasts } from "@/types/post";
import { onboardingTopics } from "../OnboardingSettings";
import { onboardingStyles } from "../OnboardingStyles";
import {
  faArrowLeft,
  faPlus,
  faArrowUp,
  faArrowDown,
  faStar as fasStar,
  faTimes,
} from "@fortawesome/free-solid-svg-icons";
import { faStar as farStar } from "@fortawesome/free-regular-svg-icons";
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
  const [factorRatings, setFactorRatings] = useState<{
    [key: string]: { direction: "up" | "down" | null; rating: number | null };
  }>({});
  const [activeSelector, setActiveSelector] = useState<{
    factor: string;
    direction: "up" | "down";
  } | null>(null);
  const [selectorPosition, setSelectorPosition] = useState<{
    top: number;
    right: number;
  } | null>(null);

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

  const handleLikelihoodClick = (
    factor: string,
    direction: "up" | "down",
    event: React.MouseEvent<HTMLButtonElement>
  ) => {
    const rect = event.currentTarget.getBoundingClientRect();
    const parentRect =
      event.currentTarget.offsetParent?.getBoundingClientRect();

    if (parentRect) {
      setSelectorPosition({
        top: rect.bottom - parentRect.top + window.scrollY,
        right: parentRect.right - rect.right,
      });
    }

    if (factorRatings[factor]?.direction === direction) {
      setActiveSelector({ factor, direction });
    } else {
      setActiveSelector({ factor, direction });
    }
  };

  const handleStarClick = (rating: number) => {
    if (activeSelector) {
      setFactorRatings({
        ...factorRatings,
        [activeSelector.factor]: {
          direction: activeSelector.direction,
          rating,
        },
      });
      setActiveSelector(null);
    }
  };

  const handleResetRating = (factor: string) => {
    const { [factor]: _, ...rest } = factorRatings;
    setFactorRatings(rest);
    setActiveSelector(null);
  };

  return (
    <div className={onboardingStyles.container}>
      <button onClick={onPrev} className={onboardingStyles.backButton}>
        <FontAwesomeIcon icon={faArrowLeft} />
      </button>
      <p className={onboardingStyles.title}>
        Here are some of the factors other forecasters are considering.
      </p>
      <div>
        <ul className="mb-4 list-none space-y-2">
          {factors.map((factor, index) => (
            <li
              key={index}
              className="flex flex-row items-center justify-between gap-4 rounded-md bg-purple-400/45 p-2.5 px-4 text-base dark:bg-purple-600/25"
            >
              {factor}
              <div className="mb-0.5 mt-1 flex w-full max-w-[180px] flex-col items-center justify-center gap-2 text-xs text-purple-700">
                <button
                  className={`flex w-full flex-row items-center justify-center gap-1 rounded-sm p-1 text-center ${
                    factorRatings[factor]?.direction === "up"
                      ? "bg-purple-700 text-white"
                      : "bg-white/75 hover:bg-purple-100 active:bg-purple-300"
                  } ${factorRatings[factor]?.direction === "down" ? "cursor-not-allowed opacity-50" : ""}`}
                  onClick={(e) => handleLikelihoodClick(factor, "up", e)}
                  disabled={factorRatings[factor]?.direction === "down"}
                >
                  <FontAwesomeIcon icon={faArrowUp} /> Increases Likelihood
                  {factorRatings[factor]?.direction === "up" &&
                    ` (${factorRatings[factor].rating}★)`}
                </button>
                <button
                  className={`flex w-full flex-row items-center justify-center gap-1 rounded-sm p-1 text-center ${
                    factorRatings[factor]?.direction === "down"
                      ? "bg-purple-700 text-white"
                      : "bg-white/75 hover:bg-purple-100 active:bg-purple-300"
                  } ${factorRatings[factor]?.direction === "up" ? "cursor-not-allowed opacity-50" : ""}`}
                  onClick={(e) => handleLikelihoodClick(factor, "down", e)}
                  disabled={factorRatings[factor]?.direction === "up"}
                >
                  <FontAwesomeIcon icon={faArrowDown} /> Decreases Likelihood
                  {factorRatings[factor]?.direction === "down" &&
                    ` (${factorRatings[factor].rating}★)`}
                </button>
              </div>
            </li>
          ))}
        </ul>
        {activeSelector && selectorPosition && (
          <div
            className="absolute z-50 rounded-md bg-white p-4 shadow-lg"
            style={{
              top: `${selectorPosition.top + 4}px`,
              right: `${selectorPosition.right}px`,
            }}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="text-lg font-semibold">Rate the impact</div>
              <button
                onClick={() => setActiveSelector(null)}
                className="text-gray-500 hover:text-gray-700"
              >
                <FontAwesomeIcon icon={faTimes} />
              </button>
            </div>
            <div className="mb-4 flex gap-2">
              {[1, 2, 3, 4, 5].map((star) => (
                <button
                  key={star}
                  onClick={() => handleStarClick(star)}
                  className="text-2xl text-yellow-400 hover:text-yellow-500"
                >
                  <FontAwesomeIcon
                    icon={
                      star <=
                      (factorRatings[activeSelector.factor]?.rating || 0)
                        ? fasStar
                        : farStar
                    }
                  />
                </button>
              ))}
            </div>
            {factorRatings[activeSelector.factor] && (
              <button
                onClick={() => handleResetRating(activeSelector.factor)}
                className="rounded-md bg-red-500 px-4 py-2 text-white hover:bg-red-600"
              >
                Reset
              </button>
            )}
          </div>
        )}
        <div className="flex">
          <input
            type="text"
            value={newFactor}
            onChange={(e) => setNewFactor(e.target.value)}
            placeholder="Add your own factors here"
            className={onboardingStyles.input}
          />
          <button
            onClick={handleAddFactor}
            className={`${onboardingStyles.smallButton} ${newFactor.trim() === "" ? "cursor-not-allowed opacity-35" : ""}`}
            disabled={newFactor.trim() === ""}
          >
            <FontAwesomeIcon icon={faPlus} /> Add
          </button>
        </div>
      </div>
      <p className={onboardingStyles.paragraph}>
        Considering others' views is an important step in forecasting
        accurately!
      </p>
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

            <div className="mt-0 flex justify-center">
              <button
                onClick={handleSubmit}
                className={onboardingStyles.button}
              >
                Predict
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Step4;
