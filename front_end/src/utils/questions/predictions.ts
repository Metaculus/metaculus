import {
  Post,
  PostStatus,
  ProjectPermissions,
  QuestionStatus,
} from "@/types/post";
import { QuestionWithForecasts } from "@/types/question";
import { CurrentUser } from "@/types/users";

import { isForecastActive } from "../forecasts/helpers";

type CanPredictParams = Pick<
  Post,
  | "user_permission"
  | "status"
  | "question"
  | "group_of_questions"
  | "conditional"
>;

export function isQuestionPrePrediction(question: {
  status?: QuestionStatus | string;
  open_time?: string | null;
}): boolean {
  return question.status === QuestionStatus.UPCOMING && !!question.open_time;
}

export function isPostPrePrediction(
  post: Pick<Post, "question" | "group_of_questions" | "conditional">
): boolean {
  if (post.question) {
    return isQuestionPrePrediction(post.question);
  }
  if (post.group_of_questions) {
    return post.group_of_questions.questions.every(isQuestionPrePrediction);
  }
  if (post.conditional) {
    return isQuestionPrePrediction(post.conditional.condition_child);
  }
  return false;
}

export function canPredictQuestion(
  {
    user_permission,
    status,
    question,
    group_of_questions,
    conditional,
  }: CanPredictParams,
  user?: CurrentUser | null
) {
  if (user?.is_bot) {
    return false;
  }

  // post level checks
  if (
    user_permission === ProjectPermissions.VIEWER ||
    (status !== PostStatus.OPEN && status !== PostStatus.APPROVED)
  ) {
    return false;
  }

  // question-specific checks
  if (question) {
    return (
      question.status === QuestionStatus.OPEN ||
      isQuestionPrePrediction(question)
    );
  }

  // group-specific checks
  if (group_of_questions) {
    return group_of_questions.questions.some(
      (q) => q.status === QuestionStatus.OPEN || isQuestionPrePrediction(q)
    );
  }

  // conditional-specific checks
  if (conditional) {
    const { condition } = conditional;

    const parentSuccessfullyResolved =
      condition.resolution === "yes" || condition.resolution === "no";
    const parentIsClosed = condition.actual_close_time
      ? new Date(condition.actual_close_time).getTime() < Date.now()
      : false;
    const conditionClosedOrResolved =
      parentSuccessfullyResolved || parentIsClosed;

    return (
      !conditionClosedOrResolved &&
      conditional.condition_child.open_time != null
    );
  }

  return false;
}

export function canWithdrawForecast(
  question: QuestionWithForecasts,
  permission?: ProjectPermissions
) {
  const latestForecast = question.my_forecasts?.latest;
  const latestForecastExpired =
    latestForecast && !isForecastActive(latestForecast);

  return (
    (question.status === QuestionStatus.OPEN ||
      question.status === QuestionStatus.UPCOMING) &&
    latestForecast &&
    !latestForecastExpired &&
    permission !== ProjectPermissions.VIEWER
  );
}
