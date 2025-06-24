import { isNil } from "lodash";

import { PredictionFlowPost } from "@/types/post";
import { isForecastActive } from "@/utils/forecasts/helpers";

export function isPostStale(post: PredictionFlowPost) {
  // minimum 20% of the question's lifetime elapsed since the forecast
  const STALE_THRESHOLD = 0.2;
  if (
    !isNil(post.question?.my_forecast) &&
    isForecastActive(post.question.my_forecast.latest)
  ) {
    return post.question.my_forecast.lifetime_elapsed > STALE_THRESHOLD;
  }
  if (!isNil(post.group_of_questions)) {
    return post.group_of_questions.questions.some(
      (question) =>
        !isNil(question.my_forecast) &&
        isForecastActive(question.my_forecast.latest) &&
        question.my_forecast.lifetime_elapsed > STALE_THRESHOLD
    );
  }
  if (!isNil(post.conditional)) {
    return (
      (!isNil(post.conditional.question_no.my_forecast) &&
        isForecastActive(post.conditional.question_no.my_forecast.latest) &&
        post.conditional.question_no.my_forecast.lifetime_elapsed >
          STALE_THRESHOLD) ||
      (!isNil(post.conditional.question_yes.my_forecast) &&
        isForecastActive(post.conditional.question_yes.my_forecast.latest) &&
        post.conditional.question_yes.my_forecast.lifetime_elapsed >
          STALE_THRESHOLD)
    );
  }
  return false;
}

export function isPostWithSignificantMovement(post: PredictionFlowPost) {
  if (!isNil(post.question?.my_forecast)) {
    return (
      !isNil(post.question.my_forecast.movement) &&
      isForecastActive(post.question.my_forecast.latest)
    );
  }
  if (!isNil(post.group_of_questions)) {
    return post.group_of_questions.questions.some(
      (question) =>
        !isNil(question.my_forecast?.movement) &&
        isForecastActive(question.my_forecast.latest)
    );
  }
  if (!isNil(post.conditional)) {
    return (
      (!isNil(post.conditional.question_no.my_forecast?.movement) &&
        isForecastActive(post.conditional.question_no.my_forecast.latest)) ||
      (!isNil(post.conditional.question_yes.my_forecast?.movement) &&
        isForecastActive(post.conditional.question_yes.my_forecast.latest))
    );
  }
  return false;
}
