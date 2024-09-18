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
    content:
      "The 'Community Prediction' represents what other predictors expect overall. Your prediction will join the Community Prediction—and because of the well-studied and unusual effectiveness of the 'wisdom of the crowd,' your prediction will help make the Community Prediction more accurate!",
  },
  {
    selector: ".tour-comment-section",
    content: "Here's where other forecasters share their perspectives.",
  },
  {
    selector: ".tour-prediction-input",
    content:
      "Okay, use the slider to make your prediction. You can always change it later.",
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
        accentColor="#3b82f6"
      />
    );
  }
);

QuestionPageTour.displayName = "QuestionPageTour";

export default QuestionPageTour;
