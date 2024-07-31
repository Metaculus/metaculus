// TODO: BE should probably return a field, that can be used as chart title
import { differenceInMilliseconds } from "date-fns";

import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { UserChoiceItem } from "@/types/choices";
import {
  Post,
  ProjectPermissions,
  PostStatus,
  PostWithForecasts,
} from "@/types/post";
import {
  MultipleChoiceForecast,
  Question,
  QuestionWithNumericForecasts,
} from "@/types/question";

export function extractQuestionGroupName(title: string) {
  const match = title.match(/\((.*?)\)/);
  return match ? match[1] : title;
}

export function extractPostStatus(post: Post) {
  if (post.scheduled_close_time && post.scheduled_resolve_time) {
    return {
      status: post.curation_status,
      actualCloseTime: post.scheduled_close_time,
      resolvedAt: post.scheduled_resolve_time,
    };
  }
  return null;
}

export function getNotebookSummary(
  markdown: string,
  width: number,
  height: number
) {
  const approxCharWidth = 10;
  const approxLineHeight = 20;

  const charsPerLine = Math.floor(width / approxCharWidth);
  const maxLines = Math.floor(height / approxLineHeight);
  const maxChars = charsPerLine * maxLines;
  markdown = markdown.replace(/\[.*?\]|\(.*?\)|\<.*?\>/g, "");
  const normalized = markdown
    .split("\n")
    .join(" ")
    .replace(/\[([^\]]+?)\]\([^)]+?\)/g, "$1");
  return (
    normalized.split("\n").join(" ").slice(0, maxChars) +
    (normalized.length > maxChars ? "..." : "")
  );
}

export function estimateReadingTime(markdown: string) {
  const words = markdown.split(/\s+/).length;
  const wordsPerMinute = 225;
  return Math.ceil(words / wordsPerMinute);
}

export function canResolveQuestion(
  question: Question,
  permission?: ProjectPermissions
) {
  return (
    !question.resolution &&
    permission &&
    [ProjectPermissions.ADMIN, ProjectPermissions.CURATOR].includes(permission)
  );
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

export function getQuestionStatus(post: PostWithForecasts | null) {
  const isLive =
    post?.curation_status == PostStatus.APPROVED ||
    post?.curation_status == PostStatus.OPEN;
  const isDone =
    post?.curation_status == PostStatus.RESOLVED ||
    post?.curation_status == PostStatus.CLOSED ||
    post?.curation_status == PostStatus.DELETED;

  return { isLive, isDone };
}

export function getPredictionQuestion(
  questions: QuestionWithNumericForecasts[],
  curationStatus: PostStatus
) {
  const sortedQuestions = questions
    .map((q) => ({
      ...q,
      resolvedAt: new Date(q.scheduled_resolve_time),
      fanName: extractQuestionGroupName(q.title),
    }))
    .sort((a, b) => differenceInMilliseconds(a.resolvedAt, b.resolvedAt));

  if (curationStatus === PostStatus.RESOLVED) {
    return sortedQuestions[sortedQuestions.length - 1];
  }

  return (
    sortedQuestions.find((q) => q.resolution === null) ??
    sortedQuestions[sortedQuestions.length - 1]
  );
}

export const generateUserForecasts = (
  questions: QuestionWithNumericForecasts[]
): UserChoiceItem[] => {
  return questions.map((question, index) => {
    const userForecast = question.forecasts.my_forecasts;
    return {
      choice: extractQuestionGroupName(question.title),
      values: userForecast?.medians,
      timestamps: userForecast?.timestamps,
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
    };
  });
};

export function sortGroupPredictionOptions(
  questions: QuestionWithNumericForecasts[]
) {
  return [...questions].sort((a, b) => {
    const aMean = a.forecasts.medians.at(-1) ?? 0;
    const bMean = b.forecasts.medians.at(-1) ?? 0;
    return bMean - aMean;
  });
}

export function sortMultipleChoicePredictions(dataset: MultipleChoiceForecast) {
  const {
    timestamps,
    nr_forecasters,
    my_forecasts,
    latest_pmf,
    latest_cdf,
    ...choices
  } = dataset;

  const choicesArray = Object.entries(choices).sort(
    ([_aChoice, aValue], [_bChoice, bValue]) => {
      const aMean = aValue.at(-1)?.median ?? 0;
      const bMean = bValue.at(-1)?.median ?? 0;
      return bMean - aMean;
    }
  );
  return choicesArray;
}
