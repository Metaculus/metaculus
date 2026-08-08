import { isNil } from "lodash";

import { PostWithForecasts } from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import {
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

export const shouldQuestionShowScores = (question: QuestionWithForecasts) => {
  const cpScores =
    question.aggregations?.[question.default_aggregation_method]?.score_data;

  return (
    !isNil(cpScores) &&
    Object.keys(cpScores).length > 0 &&
    !isUnsuccessfullyResolved(question.resolution)
  );
};

export const shouldQuestionShowUserScores = (
  question: QuestionWithForecasts
) => {
  const userScores = question.my_forecasts?.score_data;
  return (
    !isNil(userScores) &&
    Object.keys(userScores).length > 0 &&
    !isUnsuccessfullyResolved(question.resolution)
  );
};

function someQuestionIn(
  post: PostWithForecasts,
  predicate: (q: QuestionWithForecasts) => boolean
): boolean {
  if (isGroupOfQuestionsPost(post)) {
    return post.group_of_questions.questions.some(predicate);
  }

  if (isConditionalPost(post)) {
    const { condition, question_yes, question_no } = post.conditional;
    if (condition.resolution === "yes") return predicate(question_yes);
    if (condition.resolution === "no") return predicate(question_no);
  }

  if (isQuestionPost(post)) return predicate(post.question);

  return false;
}

export const shouldPostShowScores = (post: PostWithForecasts) =>
  someQuestionIn(post, shouldQuestionShowScores);

export const shouldPostShowUserScores = (post: PostWithForecasts) =>
  someQuestionIn(post, shouldQuestionShowUserScores);

/**
 * Returns the max attainable peer coverage (0–1) for a question that resolved
 * before its scheduled close time, or null if not applicable.
 */
export const getMaxCoverage = (
  question: QuestionWithForecasts
): number | null => {
  const { open_time, actual_close_time, scheduled_close_time } = question;
  if (!open_time || !actual_close_time || !scheduled_close_time) return null;
  const open = new Date(open_time).getTime();
  const actualClose = new Date(actual_close_time).getTime();
  const scheduledClose = new Date(scheduled_close_time).getTime();
  const totalDuration = scheduledClose - open;
  if (totalDuration <= 0) return null;
  return (actualClose - open) / totalDuration;
};
