import React, { useState } from "react";

import BottomNavigation from "./bottom_navigation";
import ConferenceQuestion from "./conference_question";
import ForecastOverview from "./forecast_overview";

export enum ConferenceMode {
  Question = "question",
  Overview = "overview",
}

const QuestionManager = () => {
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [mode, setMode] = useState<ConferenceMode>(ConferenceMode.Question);
  const questionIds = [11589, 27902, 28072, 18546];

  return (
    <div className="flex h-[70vh] flex-col items-center justify-between p-4">
      <div className="flex flex-grow items-center justify-center">
        {mode === ConferenceMode.Question ? (
          <ConferenceQuestion questionId={questionIds[currentQuestionIndex]} />
        ) : (
          <ForecastOverview />
        )}
      </div>
      <BottomNavigation
        currentQuestionIndex={currentQuestionIndex}
        setCurrentQuestionIndex={setCurrentQuestionIndex}
        questionIds={questionIds}
        mode={mode}
        setMode={setMode}
      />
    </div>
  );
};

export default QuestionManager;
