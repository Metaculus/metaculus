import React, { useMemo } from "react";
import Tour from "reactour";

interface QuestionPageTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const QuestionPageTour: React.FC<QuestionPageTourProps> = ({
  isOpen,
  onClose,
}) => {
  const steps = useMemo(
    () => [
      {
        selector: ".question-title",
        content: "This is the title of the question you'll be predicting on.",
      },
      {
        selector: ".prediction-input",
        content: "Use this to input your own prediction for the question.",
      },
      {
        selector: ".comment-section",
        content:
          "Review what other forecasters are saying. Consider different perspectives and arguments to refine your own predictions.",
      },
      {
        selector: ".prediction-input",
        content: "Let's try to submit a prediction now.",
      },
    ],
    []
  );

  if (!isOpen) {
    return null;
  }

  return (
    <Tour
      steps={steps}
      isOpen={isOpen}
      onRequestClose={onClose}
      rounded={5}
      accentColor="#3b82f6"
    />
  );
};

export default QuestionPageTour;
