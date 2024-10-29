import { sendGAEvent } from "@next/third-parties/google";

import { Post } from "@/types/post";

export function sendGAConditionalPredictEvent(
  projects: Post["projects"],
  alreadyPredicted: boolean,
  hideCP: boolean
) {
  if (!alreadyPredicted) {
    sendGAEvent("event", "predict", {
      event_category: "conditional",
      event_label: [
        !!projects.tournament || !!projects.question_series
          ? "tournamentPrediction"
          : null,
        hideCP ? "CPhidden" : null,
      ].filter(Boolean),
    });
  } else {
    sendGAEvent("event", "predictionUpdated", {
      event_category: "conditional",
    });
  }
}
