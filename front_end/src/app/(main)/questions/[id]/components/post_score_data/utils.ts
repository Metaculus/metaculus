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
