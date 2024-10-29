import { sendGAEvent } from "@next/third-parties/google";

import { PostWithForecasts } from "@/types/post";
import {
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

export function sendGAPredictEvent(
  post: PostWithForecasts,
  question: QuestionWithNumericForecasts | QuestionWithMultipleChoiceForecasts,
  hideCP: boolean
) {
  const alreadyPredicted = question.my_forecasts?.latest;
  if (!alreadyPredicted) {
    sendGAEvent("event", "predict", {
      value: question.type,
      event_label: [
        !!post.projects.tournament || !!post.projects.question_series
          ? "tournamentPrediction"
          : null,
        hideCP ? "CPhidden" : null,
      ].filter(Boolean),
    });
  } else {
    sendGAEvent("event", "predictionUpdated", {
      value: question.type,
    });
  }
}
