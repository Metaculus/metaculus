import { isNil } from "lodash";

import {
  AMBIGUOUS_RESOLUTION,
  ANNULLED_RESOLUTION,
} from "@/constants/questions";
import { Post, ProjectPermissions, Resolution } from "@/types/post";
import { Question } from "@/types/question";

export function extractPostResolution(post: Post): Resolution | null {
  if (post.question) {
    return post.question.resolution;
  }

  if (post.group_of_questions) {
    return post.group_of_questions?.questions[0]?.resolution ?? null;
  }

  if (post.conditional) {
    return post.conditional.condition.resolution;
  }

  return null;
}

export function canChangeQuestionResolution(
  question: Question,
  permission?: ProjectPermissions,
  resolve = true
) {
  return (
    (resolve
      ? !isResolved(question.resolution)
      : isResolved(question.resolution)) &&
    permission &&
    permission === ProjectPermissions.ADMIN
  );
}

export function isResolved(resolution: Resolution | null): boolean {
  return !isNil(resolution);
}

export function isUnsuccessfullyResolved(
  resolution: Resolution | null
): boolean {
  return (
    resolution === ANNULLED_RESOLUTION || resolution === AMBIGUOUS_RESOLUTION
  );
}

export function isSuccessfullyResolved(resolution: Resolution | null) {
  return isResolved(resolution) && !isUnsuccessfullyResolved(resolution);
}
