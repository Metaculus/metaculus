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

export function shouldPostShowScores(post: PostWithForecasts): boolean {
  if (isGroupOfQuestionsPost(post)) {
    return post.group_of_questions.questions.some(shouldQuestionShowScores);
  }

  if (isConditionalPost(post)) {
    const { condition, question_yes, question_no } = post.conditional;

    if (condition.resolution === "yes") {
      return shouldQuestionShowScores(question_yes);
    } else if (condition.resolution === "no") {
      return shouldQuestionShowScores(question_no);
    }
  }

  if (isQuestionPost(post)) return shouldQuestionShowScores(post.question);

  return false;
}
