import { parseISO } from "date-fns";
import { isNil } from "lodash";

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
    status !== PostStatus.OPEN
  ) {
    return false;
  }

  // question-specific checks
  if (question) {
    const { open_time } = question;

    return !isNil(open_time) && parseISO(open_time) < new Date();
  }

  // group-specific checks
  if (group_of_questions) {
    return group_of_questions.questions.some(
      (q) => q.status === QuestionStatus.OPEN
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
      conditional.condition_child.open_time !== undefined &&
      new Date(conditional.condition_child.open_time) <= new Date()
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
    question.status === QuestionStatus.OPEN &&
    latestForecast &&
    !latestForecastExpired &&
    permission !== ProjectPermissions.VIEWER
  );
}
