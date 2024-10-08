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
      "The ‘Community Prediction’ combines all the forecasts people made on the question, including yours. It’s also very difficult to consistently beat. In fact, because of the “wisdom of the crowd,” your forecast will tend to make the Community Prediction even more accurate — even if you’re new to forecasting! Also, sometimes you might want to know the ‘why’ behind others’ predictions, or explain your own. For that, you can always scroll down to the comment section.",
  },
  {
    selector: ".tour-newsmatch",
    content:
      "We even collect recent relevant articles in case you want to read up before you make your prediction.",
  },
  {
    selector: ".tour-prediction-input",
    content:
      "Just like we did before, take a moment to consider factors that could influence the outcome. What makes it more likely? What makes it less? Now drag the slider or enter a probability in the box. When you’re ready, click Predict. You can always change your prediction later.",
  },
  {
    selector: ".tour-resolution",
    content:
      "Great work. You’re thinking like a forecaster. We’ll let you know when there’s an answer to this question — likely by the Scheduled Resolution date here. Then, you’ll find out how your prediction stacked up against other predictors’, and you’ll be one forecast closer to skillfully, accurately predicting the future.",
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
