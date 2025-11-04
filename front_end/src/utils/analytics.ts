import { sendGAEvent } from "@next/third-parties/google";
import posthog from "posthog-js";

import { bwTrackPredictionIfConsent } from "@/app/(campaigns-registration)/(bridgewater)/utils/pixel-apis";
import { Post, PostWithForecasts } from "@/types/post";
import {
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
} from "@/types/question";

export function sendAnalyticsEvent(
  event: string,
  properties?: Record<string, unknown>
) {
  posthog.capture(event, properties);
  sendGAEvent("event", event, { ...properties });
}

export function sendConditionalPredictEvent(
  projects: Post["projects"],
  alreadyPredicted: boolean,
  hideCP: boolean
) {
  const projectId = projects.default_project.id;
  const tournamentIds = projects.tournament?.map((t) => t.id);

  bwTrackPredictionIfConsent();

  if (!alreadyPredicted) {
    posthog.capture("predict", {
      event_category: "conditional",
      event_label: [
        !!projects.tournament || !!projects.question_series
          ? "tournamentPrediction"
          : null,
        hideCP ? "CPhidden" : null,
      ].filter(Boolean),
      project_id: projectId,
      tournament_ids: tournamentIds,
    });
    sendGAEvent("event", "predict", {
      event_category: "conditional",
      event_label: [
        !!projects.tournament || !!projects.question_series
          ? "tournamentPrediction"
          : null,
        hideCP ? "CPhidden" : null,
      ].filter(Boolean),
      project_id: projectId,
      tournament_ids: tournamentIds,
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
  const projectId = post.projects.default_project.id;
  const tournamentIds = post.projects.tournament?.map((t) => t.id);

  bwTrackPredictionIfConsent();

  if (!alreadyPredicted) {
    posthog.capture("predict", {
      event_category: question.type,
      event_label: [
        !!post.projects.tournament || !!post.projects.question_series
          ? "tournamentPrediction"
          : null,
        hideCP ? "CPhidden" : null,
      ].filter(Boolean),
      project_id: projectId,
      tournament_ids: tournamentIds,
    });
    sendGAEvent("event", "predict", {
      event_category: question.type,
      event_label: [
        !!post.projects.tournament || !!post.projects.question_series
          ? "tournamentPrediction"
          : null,
        hideCP ? "CPhidden" : null,
      ].filter(Boolean),
      project_id: projectId,
      tournament_ids: tournamentIds,
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
