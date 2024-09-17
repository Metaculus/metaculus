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
        selector: ".tour-question-title",
        content: "Here’s the question title.",
      },
      {
        selector: ".tour-cp",
        content: "Here’s what other predictors expect.",
      },
      {
        selector: ".tour-comment-section",
        content:
          "Here’s where other forecasters share their arguments and perspectives.",
      },
      {
        selector: ".tour-prediction-input",
        content:
          "Let’s make a prediction. You can always adjust it later if you change your mind.",
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
