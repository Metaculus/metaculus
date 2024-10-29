import React, { useState } from "react";

import BottomNavigation from "./bottom_navigation";
import ConferenceQuestion from "./conference_question";
import ForecastOverview from "./forecast_overview";
import { getPost } from "@/app/(main)/questions/actions";

export enum ConferenceMode {
  Question = "question",
  Overview = "overview",
}

const QuestionManager = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mode, setMode] = useState<ConferenceMode>(ConferenceMode.Question);
  const questionIds = [11589, 27902, 28072, 18546];
  const tournamentId = 1;

  const [prediction, setPrediction] = useState<number | null>(null);

  const fetchUserPrediction = async (questionId: number): Promise<number | null> => {
    try {
      const post = await getPost(questionId);
      const value = post.question?.my_forecasts?.latest?.forecast_values[1] ?? null;
      if (value === null) return null;
      return value * 100;
    } catch (error) {
      console.error('Error fetching user prediction:', error);
      return null;
    }
  };

  const handleNavigation = async (direction: 'forward' | 'previous' | 'back') => {
    switch (direction) {
      case 'forward':
        if (currentQuestionIndex === questionIds.length - 1) {
          setMode(ConferenceMode.Overview);
        } else {
          const nextIndex = currentQuestionIndex + 1;
          const nextPrediction = await fetchUserPrediction(questionIds[nextIndex]);
          setPrediction(nextPrediction);
          setCurrentQuestionIndex(nextIndex);
        }
        break;
      case 'previous':
        const prevIndex = Math.max(0, currentQuestionIndex - 1);
        const prevPrediction = await fetchUserPrediction(questionIds[prevIndex]);
        setPrediction(prevPrediction);
        setCurrentQuestionIndex(prevIndex);
        break;
      case 'back':
        const currentPrediction = await fetchUserPrediction(questionIds[currentQuestionIndex]);
        setPrediction(currentPrediction);
        setMode(ConferenceMode.Question);
        break;
    }
  };

  return (
    <div className="flex h-[70vh] flex-col items-center justify-between">
      <div className="w-full flex-grow overflow-y-auto">
        <div className="flex min-h-full items-center justify-center p-4">
          {mode === ConferenceMode.Question ? (
            <ConferenceQuestion
              questionId={questionIds[currentQuestionIndex]}
              handleNavigation={handleNavigation}
              prediction={prediction}
              setPrediction={setPrediction}
            />
          ) : (
            <ForecastOverview questionIds={questionIds} />
          )}
        </div>
      </div>
      <BottomNavigation
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        questionIds={questionIds}
        mode={mode}
        setMode={setMode}
        tournamentId={tournamentId}
        handleNavigation={handleNavigation}
      />
    </div>
  );
};

export default QuestionManager;
