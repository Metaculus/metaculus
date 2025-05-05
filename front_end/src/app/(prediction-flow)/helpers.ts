import { isNil } from "lodash";

import { PredictionFlowPost } from "@/types/post";

export function isPostStale(post: PredictionFlowPost) {
  // minimum 20% of the question's lifetime elapsed since the forecast
  const STALE_THRESHOLD = 0.02;
  if (
    !isNil(post.question?.my_forecast) &&
    !isNil(post.question.my_forecast.lifetime_elapsed)
  ) {
    return post.question.my_forecast.lifetime_elapsed > STALE_THRESHOLD;
  }
  if (!isNil(post.group_of_questions)) {
    return post.group_of_questions.questions.some(
      (question) =>
        !isNil(question.my_forecast?.lifetime_elapsed) &&
        question.my_forecast.lifetime_elapsed > STALE_THRESHOLD
    );
  }
  if (!isNil(post.conditional)) {
    return (
      (!isNil(post.conditional.question_no.my_forecast?.lifetime_elapsed) &&
        post.conditional.question_no.my_forecast.lifetime_elapsed >
          STALE_THRESHOLD) ||
      (!isNil(post.conditional.question_yes.my_forecast?.lifetime_elapsed) &&
        post.conditional.question_yes.my_forecast.lifetime_elapsed >
          STALE_THRESHOLD)
    );
  }
  return false;
}

export function isPostWithSignificantMovement(post: PredictionFlowPost) {
  // CP chang is more than 20% of question range
  const MOVEMENT_THRESHOLD = 0.2;
  if (!isNil(post.question?.my_forecast)) {
    return (
      !isNil(post.question.my_forecast.movement) &&
      post.question.my_forecast.movement > MOVEMENT_THRESHOLD
    );
  }
  if (!isNil(post.group_of_questions)) {
    return post.group_of_questions.questions.some(
      (question) =>
        !isNil(question.my_forecast?.movement) &&
        question.my_forecast.movement > MOVEMENT_THRESHOLD
    );
  }
  if (!isNil(post.conditional)) {
    return (
      (!isNil(post.conditional.question_no.my_forecast?.movement) &&
        post.conditional.question_no.my_forecast.movement >
          MOVEMENT_THRESHOLD) ||
      (!isNil(post.conditional.question_yes.my_forecast?.movement) &&
        post.conditional.question_yes.my_forecast.movement > MOVEMENT_THRESHOLD)
    );
  }
  return false;
}
