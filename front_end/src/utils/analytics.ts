import { sendGAEvent } from "@next/third-parties/google";
import posthog from "posthog-js";

import { Post, PostWithForecasts } from "@/types/post";
import {
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

export function sendAnalyticsEvent(
  event: string,
  properties?: Record<string, any>
) {
  posthog.capture(event, properties);
  sendGAEvent("event", event, { ...properties });
}

export function sendConditionalPredictEvent(
  projects: Post["projects"],
  alreadyPredicted: boolean,
  hideCP: boolean
) {
  if (!alreadyPredicted) {
    posthog.capture("predict", {
      event_category: "conditional",
      event_label: [
        !!projects.tournament || !!projects.question_series
          ? "tournamentPrediction"
          : null,
        hideCP ? "CPhidden" : null,
      ].filter(Boolean),
    });
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
    posthog.capture("predictionUpdated", {
      event_category: "conditional",
    });
    sendGAEvent("event", "predictionUpdated", {
      event_category: "conditional",
    });
  }
}

export function sendPredictEvent(
  post: PostWithForecasts,
  question: QuestionWithNumericForecasts | QuestionWithMultipleChoiceForecasts,
  hideCP: boolean
) {
  const alreadyPredicted = question.my_forecasts?.latest;
  if (!alreadyPredicted) {
    posthog.capture("predict", {
      event_category: question.type,
      event_label: [
        !!post.projects.tournament || !!post.projects.question_series
          ? "tournamentPrediction"
          : null,
        hideCP ? "CPhidden" : null,
      ].filter(Boolean),
    });
    sendGAEvent("event", "predict", {
      event_category: question.type,
      event_label: [
        !!post.projects.tournament || !!post.projects.question_series
          ? "tournamentPrediction"
          : null,
        hideCP ? "CPhidden" : null,
      ].filter(Boolean),
    });
  } else {
    posthog.capture("predictionUpdated", {
      event_category: question.type,
    });
    sendGAEvent("event", "predictionUpdated", {
      event_category: question.type,
    });
  }
}
