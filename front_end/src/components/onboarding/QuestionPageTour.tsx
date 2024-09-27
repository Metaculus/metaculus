import React, { useCallback, useMemo } from "react";
import Tour from "reactour";

interface QuestionPageTourProps {
  isOpen: boolean;
  onClose: () => void;
}

const tourSteps = [
  {
    selector: ".tour-question-title",
    content:
      "Here at the top of the question page is the title. This is the question we’ll be forecasting.",
  },
  {
    selector: ".tour-cp",
    content:
      "The 'Community Prediction' represents what other predictors expect overall. Your prediction will join the Community Prediction—and because of the well-studied and unusual effectiveness of the 'wisdom of the crowd,' your prediction will help make the Community Prediction more accurate!",
  },
  {
    selector: ".tour-prediction-input",
    content:
      "Just like we did before, take a moment to consider factors that could influence the outcome. What makes it more likely? What makes it less? Now drag the slider or enter a probability in the box. When you’re ready, click Predict. You can always change your prediction later.",
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
