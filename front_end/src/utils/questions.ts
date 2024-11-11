// TODO: BE should probably return a field, that can be used as chart title
import { differenceInMilliseconds, isValid } from "date-fns";
import { capitalize, isNil } from "lodash";
import { remark } from "remark";
import strip from "strip-markdown";

export const ANNULED_RESOLUTION = "annulled";
export const AMBIGUOUS_RESOLUTION = "ambiguous";

import { ConditionalTableOption } from "@/app/(main)/questions/[id]/components/forecast_maker/group_forecast_table";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { UserChoiceItem } from "@/types/choices";
import {
  Post,
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
  QuestionStatus,
  Resolution,
} from "@/types/post";
import {
  MultipleChoiceForecast,
  Question,
  QuestionType,
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/charts";
import { abbreviatedNumber } from "@/utils/number_formatters";

import { formatDate } from "./date_formatters";

export function extractQuestionGroupName(title: string) {
  const match = title.match(/\(([^()]*(?:\([^()]*\)[^()]*)*)\)[^()]*$/);
  return (match ? match[1] : title) || title;
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
  const approxCharWidth = 8;
  const approxLineHeight = 20;

  const charsPerLine = Math.floor(width / approxCharWidth);
  const maxLines = Math.floor(height / approxLineHeight);
  const maxChars = charsPerLine * maxLines;

  const file = remark()
    .use(strip, { keep: ["link"] })
    .processSync(markdown);

  markdown = String(file).split("\n").join(" ");

  let rawLength = 0;
  let result = "";
  const tokens = markdown.match(/(\[.*?\]\(.*?\)|`.*?`|.|\n)/g) || [];

  for (const token of tokens) {
    if (token.startsWith("[") && token.includes("](")) {
      // handle links markdown
      const linkText = token.match(/\[(.*?)\]/)?.[1] || "";
      const linkUrl = token.match(/\((.*?)\)/)?.[1] || "";

      if (rawLength + linkText.length > maxChars) {
        const remainingChars = maxChars - rawLength;
        result += `[${linkText.slice(0, remainingChars)}...](${linkUrl})`;
        break;
      }

      result += token;
      rawLength += linkText.length;
    } else {
      // handle raw text
      if (rawLength + token.length >= maxChars) {
        result += token.slice(0, maxChars - rawLength);
        result += "...";
        break;
      }
      result += token;
      rawLength += token.length;
    }
  }

  result = result.trimEnd();
  return result;
}

export function estimateReadingTime(markdown: string) {
  const words = markdown.split(/\s+/).length;
  const wordsPerMinute = 225;
  return Math.ceil(words / wordsPerMinute);
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
    [ProjectPermissions.ADMIN, ProjectPermissions.CURATOR].includes(permission)
  );
}

export function isResolved(resolution: Resolution | null): boolean {
  return !isNil(resolution);
}

export function isUnsuccessfullyResolved(
  resolution: Resolution | null
): boolean {
  return (
    resolution === ANNULED_RESOLUTION || resolution === AMBIGUOUS_RESOLUTION
  );
}

export function isSuccessfullyResolved(resolution: Resolution | null) {
  return isResolved(resolution) && !isUnsuccessfullyResolved(resolution);
}

export function formatResolution(
  resolution: number | string | null | undefined,
  questionType: QuestionType,
  locale: string
) {
  if (resolution === null || resolution === undefined) {
    return "-";
  }

  resolution = String(resolution);

  if (["yes", "no"].includes(resolution)) {
    return capitalize(resolution);
  }

  if (isUnsuccessfullyResolved(resolution)) {
    return capitalize(resolution);
  }

  if (resolution === "below_lower_bound") {
    return "Below lower bound";
  }
  if (resolution === "above_upper_bound") {
    return "Above upper bound";
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
    post.status === PostStatus.OPEN
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
  const isLive = post?.status == PostStatus.OPEN;
  const isDone =
    post?.curation_status == PostStatus.RESOLVED ||
    post?.curation_status == PostStatus.CLOSED ||
    post?.curation_status == PostStatus.DELETED;
  const hasForecasts = post?.nr_forecasters ? post.nr_forecasters > 0 : false;

  return { isLive, isDone, hasForecasts };
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

export const generateUserForecastsForMultipleQuestion = (
  question: QuestionWithMultipleChoiceForecasts
): UserChoiceItem[] | undefined => {
  const latest = question.aggregations.recency_weighted.latest;
  const options = question.options!;

  const choiceOrdering: number[] = options.map((_, i) => i);
  choiceOrdering.sort((a, b) => {
    const aCenter = latest?.forecast_values[a] ?? 0;
    const bCenter = latest?.forecast_values[b] ?? 0;
    return bCenter - aCenter;
  });

  return options.map((choice, index) => {
    const userForecasts = question.my_forecasts?.history;
    return {
      choice,
      values:
        userForecasts?.map((forecast) => forecast.forecast_values[index]) ?? [],
      timestamps: userForecasts?.map((forecast) => forecast.start_time) ?? [],
      color:
        MULTIPLE_CHOICE_COLOR_SCALE[choiceOrdering.indexOf(index)] ??
        METAC_COLORS.gray["400"],
    };
  });
};

export const generateUserForecasts = (
  questions: QuestionWithNumericForecasts[],
  scaling?: Scaling
): UserChoiceItem[] => {
  return questions.map((question, index) => {
    const userForecasts = question.my_forecasts;

    return {
      choice: extractQuestionGroupName(question.title),
      values: userForecasts?.history.map((forecast) =>
        question.type === "binary"
          ? forecast.forecast_values[1]
          : scaling
            ? unscaleNominalLocation(
                scaleInternalLocation(forecast.centers![0], question.scaling),
                scaling
              )
            : forecast.centers![0]
      ),
      timestamps: userForecasts?.history.map((forecast) => forecast.start_time),
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      unscaledValues: userForecasts?.history.map((forecast) =>
        question.type === "binary"
          ? forecast.forecast_values[1]
          : forecast.centers![0]
      ),
    };
  });
};

export function sortGroupPredictionOptions(
  questions: QuestionWithNumericForecasts[]
) {
  return [...questions].sort((a, b) => {
    const aMean = a.aggregations.recency_weighted.latest?.centers![0] ?? 0;
    const bMean = b.aggregations.recency_weighted.latest?.centers![0] ?? 0;
    return bMean - aMean;
  });
}

export function getQuestionTitle(post: Post) {
  if (post.conditional) {
    return getConditionalQuestionTitle(post.conditional.question_yes);
  }

  return post.title;
}

export function getPredictionInputMessage(post: Post) {
  switch (post.status) {
    case PostStatus.UPCOMING: {
      return "predictionUpcomingMessage";
    }
    case PostStatus.APPROVED: {
      if (Date.parse(post.open_time) > Date.now()) {
        return "predictionUpcomingMessage";
      }
      return null;
    }
    case PostStatus.REJECTED:
    case PostStatus.PENDING:
    case PostStatus.DRAFT: {
      return "predictionUnapprovedMessage";
    }
    case PostStatus.CLOSED: {
      if (!post.resolved) return "predictionClosedMessage";
    }
    default:
      return null;
  }
}

export function getSubquestionPredictionInputMessage(
  option: ConditionalTableOption
) {
  switch (option.question.status) {
    case QuestionStatus.CLOSED:
      return "predictionClosedMessage";
    case QuestionStatus.UPCOMING:
      return "predictionUpcomingMessage";
    default:
      return null;
  }
}

export function parseQuestionId(questionUrlOrId: string): {
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
    const urlPattern = /\/questions\/(\d+)\/?/;
    const match = questionUrlOrId.match(urlPattern);
    if (match && match[1]) {
      result.postId = Number(match[1]);
    }
  }

  return result;
}
