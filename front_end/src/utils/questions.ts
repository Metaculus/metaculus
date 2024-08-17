// TODO: BE should probably return a field, that can be used as chart title
import { differenceInMilliseconds, isValid, parseISO } from "date-fns";
import { capitalize, isNil } from "lodash";

import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { UserChoiceItem } from "@/types/choices";
import {
  Post,
  ProjectPermissions,
  PostStatus,
  PostWithForecasts,
  Resolution,
} from "@/types/post";
import {
  MultipleChoiceForecast,
  Question,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { abbreviatedNumber } from "@/utils/number_formatters";

import { formatDate } from "./date_formatters";

export function extractQuestionGroupName(title: string) {
  const match = title.match(/\((.*?)\)/);
  return match ? match[1] : title;
}

export function extractPostResolution(post: Post): Resolution | null {
  if (post.question) {
    return post.question.resolution;
  }

  if (post.group_of_questions) {
    return post.group_of_questions?.questions[0]?.resolution;
  }

  if (post.conditional) {
    return post.conditional.condition.resolution;
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

export function isResolved(resolution: Resolution | null): boolean {
  return !isNil(resolution);
}

export function isUnsuccessfullyResolved(
  resolution: Resolution | null
): boolean {
  return resolution === "annulled" || resolution === "ambiguous";
}

export function isSuccessfullyResolved(resolution: Resolution | null) {
  return isResolved(resolution) && !isUnsuccessfullyResolved(resolution);
}

export function formatResolution(
  resolution: number | string | null | undefined,
  questionType: QuestionType,
  locale: string
) {
  resolution = String(resolution);

  if (resolution === "null" || resolution === "undefined") {
    return "Annulled";
  }

  if (["yes", "no"].includes(resolution)) {
    return capitalize(resolution);
  }

  if (resolution === "ambiguous" || resolution === "annulled") {
    return capitalize(resolution);
  }

  if (questionType === QuestionType.Date) {
    if (!isNaN(Number(resolution)) && resolution.trim() !== "") {
      const date = new Date(Number(resolution));

      return isValid(date)
        ? formatDate(locale, new Date(Number(resolution)))
        : resolution;
    }

    const date = new Date(resolution);
    return isValid(date)
      ? formatDate(locale, new Date(resolution))
      : resolution;
  }

  if (!isNaN(Number(resolution)) && resolution.trim() !== "") {
    return abbreviatedNumber(Number(resolution));
  }

  if (questionType === QuestionType.MultipleChoice) {
    return resolution;
  }

  return resolution;
}

export function canPredictQuestion(post: PostWithForecasts) {
  return (
    post.user_permission !== ProjectPermissions.VIEWER &&
    (post.question
      ? post.question.open_time
        ? parseISO(post.question.open_time) < new Date()
        : false
      : true) &&
    !isNil(post.published_at) &&
    parseISO(post.published_at) <= new Date() &&
    post.status === PostStatus.APPROVED
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
    const userForecasts = question.my_forecasts;
    return {
      choice: extractQuestionGroupName(question.title),
      values: userForecasts?.history.map((forecast) =>
        question.type === "binary"
          ? forecast.forecast_values[1]
          : forecast.centers![0]
      ),
      timestamps: userForecasts?.history.map((forecast) => forecast.start_time),
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
    forecast_values,
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
