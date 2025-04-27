import { isNil } from "lodash";

import {
  ConditionalPost,
  GroupOfQuestionsPost,
  NotebookPost,
  Post,
  PostStatus,
  PostWithForecasts,
  QuestionPost,
} from "@/types/post";
import {
  Question,
  QuestionType,
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";

export function isMultipleChoicePost(
  post: PostWithForecasts
): post is QuestionPost<QuestionWithMultipleChoiceForecasts> {
  return post.question?.type === QuestionType.MultipleChoice;
}

export function isQuestionPost<QT>(post: Post<QT>): post is QuestionPost<QT> {
  return !isNil(post.question);
}

export function isGroupOfQuestionsPost<QT>(
  post: Post<QT>
): post is GroupOfQuestionsPost<
  QT extends Question | QuestionWithNumericForecasts ? QT : Question
> {
  return !isNil(post.group_of_questions);
}

export function isConditionalPost<QT>(
  post: Post<QT>
): post is ConditionalPost<
  QT extends Question | QuestionWithNumericForecasts ? QT : Question
> {
  return !isNil(post.conditional);
}

export function isNotebookPost(post: Post): post is NotebookPost {
  return !isNil(post.notebook);
}

export function getConditionTitle(
  postTitle: string,
  condition: Question
): string {
  const titleCandidate = postTitle.split("→")[0];
  if (titleCandidate) {
    return titleCandidate.trim();
  }

  return condition.title;
}

export function getConditionalQuestionTitle(question: Question): string {
  const titleCandidate = question.title.split("→")[1];
  if (titleCandidate) {
    return titleCandidate.trim();
  }

  return question.title;
}

export function getPostTitle(post: Post) {
  if (post.conditional) {
    return getConditionalQuestionTitle(post.conditional.question_yes);
  }

  return post.title;
}

export function getQuestionStatus(post: PostWithForecasts | null) {
  const isLive = post?.status == PostStatus.OPEN;
  const isDone =
    post?.curation_status == PostStatus.RESOLVED ||
    post?.curation_status == PostStatus.CLOSED ||
    post?.curation_status == PostStatus.DELETED;
  const hasForecasts = post?.nr_forecasters ? post.nr_forecasters > 0 : false;

  return { isLive, isDone, hasForecasts };
}

export function parseQuestionId(
  questionUrlOrId: string,
  includeNotebooks: boolean = false
): {
  postId: number | null;
  questionId: number | null;
} {
  const result: {
    postId: number | null;
    questionId: number | null;
  } = {
    postId: null,
    questionId: null,
  };

  // Check for subquestion ID in query params
  const subQuestionPattern = /sub-question=(\d+)/;
  const subQuestionMatch = questionUrlOrId.match(subQuestionPattern);
  if (subQuestionMatch && subQuestionMatch[1]) {
    result.questionId = Number(subQuestionMatch[1]);
  }

  // Check for post ID
  const id = Number(questionUrlOrId);
  if (!isNaN(id)) {
    result.postId = id;
  } else {
    const urlPattern = includeNotebooks
      ? /\/(?:questions|notebooks)\/(\d+)\/?/
      : /\/questions\/(\d+)\/?/;
    const match = questionUrlOrId.match(urlPattern);
    if (match && match[1]) {
      result.postId = Number(match[1]);
    }
  }

  return result;
}

export function getPostDrivenTime(rawTime: string | null | undefined) {
  return rawTime ? new Date(rawTime).getTime() : undefined;
}

export function getContinuousGroupScaling(
  questions: QuestionWithNumericForecasts[]
) {
  const rangeMaxPoints: number[] = [];
  const rangeMinPoints: number[] = [];
  const zeroPoints: number[] = [];
  questions.forEach((question) => {
    if (question.scaling.range_max !== null) {
      rangeMaxPoints.push(question.scaling.range_max);
    }

    if (question.scaling.range_min !== null) {
      rangeMinPoints.push(question.scaling.range_min);
    }

    if (question.scaling.zero_point !== null) {
      zeroPoints.push(question.scaling.zero_point);
    }
  });
  const scaling: Scaling = {
    range_max: rangeMaxPoints.length > 0 ? Math.max(...rangeMaxPoints) : null,
    range_min: rangeMinPoints.length > 0 ? Math.min(...rangeMinPoints) : null,
    zero_point: zeroPoints.length > 0 ? Math.min(...zeroPoints) : null,
  };
  // we can have mixes of log and linear scaled options
  // which leads to a derived zero point inside the range which is invalid
  // so just ignore the log scaling in this case
  if (
    scaling.zero_point !== null &&
    !isNil(scaling.range_min) &&
    !isNil(scaling.range_max) &&
    scaling.range_min <= scaling.zero_point &&
    scaling.zero_point <= scaling.range_max
  ) {
    scaling.zero_point = null;
  }
  return scaling;
}
