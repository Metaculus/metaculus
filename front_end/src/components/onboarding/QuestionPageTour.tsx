import React, { useCallback, useMemo } from "react";
import Tour from "reactour";

interface QuestionPageTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const tourSteps = [
  {
    selector: ".tour-question-title",
    content: "Here's the question title.",
  },
  {
    selector: ".tour-cp",
    content: "Here's what other predictors expect.",
  },
  {
    selector: ".tour-comment-section",
    content:
      "Here's where other forecasters share their arguments and perspectives.",
  },
  {
    selector: ".tour-prediction-input",
    content:
      "Let's make a prediction. You can always adjust it later if you change your mind.",
  },
];

const QuestionPageTour: React.FC<QuestionPageTourProps> = React.memo(
  ({ isOpen, onClose }) => {
    const memoizedOnClose = useCallback(() => {
      onClose();
    }, [onClose]);

    if (!isOpen) {
      return null;
    }

    return (
      <Tour
        steps={tourSteps}
        isOpen={isOpen}
        onRequestClose={memoizedOnClose}
        rounded={5}
        accentColor="#3b82f6"
      />
    );
  }
);

QuestionPageTour.displayName = "QuestionPageTour";

export default QuestionPageTour;
