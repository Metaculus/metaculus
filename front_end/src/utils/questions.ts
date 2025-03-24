// TODO: BE should probably return a field, that can be used as chart title
import { differenceInMilliseconds, format, isValid, parseISO } from "date-fns";
import { capitalize, isNil } from "lodash";
import { remark } from "remark";
import strip from "strip-markdown";

import { ContinuousGroupOption } from "@/app/(main)/questions/[id]/components/forecast_maker/continuous_group_accordion/group_forecast_accordion";
import { METAC_COLORS, MULTIPLE_CHOICE_COLOR_SCALE } from "@/constants/colors";
import { GroupOfQuestionsGraphType } from "@/types/charts";
import { UserChoiceItem } from "@/types/choices";
import {
  ConditionalPost,
  GroupOfQuestionsPost,
  NotebookPost,
  Post,
  PostGroupOfQuestions,
  PostGroupOfQuestionsSubquestionsOrder,
  PostStatus,
  PostWithForecasts,
  ProjectPermissions,
  QuestionPost,
  QuestionStatus,
  Resolution,
} from "@/types/post";
import {
  ForecastAvailability,
  Question,
  QuestionLinearGraphType,
  QuestionType,
  QuestionWithForecasts,
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import {
  getDisplayValue,
  getQuestionDateFormatString,
  scaleInternalLocation,
  unscaleNominalLocation,
} from "@/utils/charts";
import { abbreviatedNumber } from "@/utils/number_formatters";

import { formatDate } from "./date_formatters";

export const ANNULED_RESOLUTION = "annulled";
export const AMBIGUOUS_RESOLUTION = "ambiguous";
// Max length of a unit to be treated as compact
export const QUESTION_UNIT_COMPACT_LENGTH = 3;

export function isMultipleChoicePost(post: PostWithForecasts) {
  return post.question?.type === QuestionType.MultipleChoice;
}

export function isQuestionPost<QT>(post: Post<QT>): post is QuestionPost<QT> {
  return !isNil(post.question);
}

export function isGroupOfQuestionsPost<QT>(
  post: Post<QT>
): post is GroupOfQuestionsPost<QT> {
  return !isNil(post.group_of_questions);
}

export function isConditionalPost<QT>(
  post: Post<QT>
): post is ConditionalPost<QT> {
  return !isNil(post.conditional);
}

export function isNotebookPost(post: Post): post is NotebookPost {
  return !isNil(post.notebook);
}

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

export function getMarkdownSummary({
  markdown,
  width,
  height,
  charWidth,
  withLinks = true,
}: {
  markdown: string;
  width: number;
  height: number;
  charWidth?: number;
  withLinks?: boolean;
}) {
  const approxCharWidth = charWidth ?? 8;
  const approxLineHeight = 20;
  const charsPerLine = Math.floor(width / approxCharWidth);
  const maxLines = Math.floor(height / approxLineHeight);
  const maxChars = charsPerLine * maxLines;

  const file = remark()
    .use(strip, { keep: withLinks ? ["link"] : [] })
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
    resolution === ANNULED_RESOLUTION || resolution === AMBIGUOUS_RESOLUTION
  );
}

export function isSuccessfullyResolved(resolution: Resolution | null) {
  return isResolved(resolution) && !isUnsuccessfullyResolved(resolution);
}

export function formatResolution({
  resolution,
  questionType,
  locale,
  scaling,
  unit,
  shortBounds = false,
}: {
  resolution: number | string | null | undefined;
  questionType: QuestionType;
  locale: string;
  scaling?: Scaling;
  unit?: string;
  shortBounds?: boolean;
}) {
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
    if (shortBounds && scaling) {
      return (
        "<" +
        getDisplayValue({
          value: 0,
          questionType,
          scaling,
        })
      );
    }
    return "Below lower bound";
  }
  if (resolution === "above_upper_bound") {
    if (shortBounds && scaling) {
      return (
        ">" +
        getDisplayValue({
          value: 1,
          questionType,
          scaling,
        })
      );
    }
    return "Above upper bound";
  }

  if (questionType === QuestionType.Date) {
    if (!isNaN(Number(resolution)) && resolution.trim() !== "") {
      const date = new Date(Number(resolution));
      if (isValid(date)) {
        return scaling
          ? format(date, getQuestionDateFormatString(scaling))
          : formatDate(locale, date);
      }
      return resolution;
    }

    const date = new Date(resolution);
    if (isValid(date)) {
      return scaling
        ? format(date, getQuestionDateFormatString(scaling))
        : formatDate(locale, date);
    }
    return resolution;
  }

  if (!isNaN(Number(resolution)) && resolution.trim() !== "") {
    return formatValueUnit(abbreviatedNumber(Number(resolution)), unit);
  }

  if (questionType === QuestionType.MultipleChoice) {
    return resolution;
  }

  return resolution;
}

export function formatMultipleChoiceResolution(
  resolution: number | string | null | undefined,
  choice: string
) {
  if (resolution === null || resolution === undefined) {
    return "-";
  }

  resolution = String(resolution);

  if (isUnsuccessfullyResolved(resolution)) {
    return capitalize(resolution);
  }

  return choice.toLowerCase() === resolution.toLowerCase() ? "Yes" : "No";
}

type CanPredictParams = Pick<
  Post,
  | "user_permission"
  | "status"
  | "question"
  | "group_of_questions"
  | "conditional"
>;
export function canPredictQuestion({
  user_permission,
  status,
  question,
  group_of_questions,
  conditional,
}: CanPredictParams) {
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
  return (
    question.status === QuestionStatus.OPEN &&
    question.my_forecasts?.latest?.end_time === null &&
    permission !== ProjectPermissions.VIEWER
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
      fanName: q.label,
    }))
    .sort((a, b) => differenceInMilliseconds(a.resolvedAt, b.resolvedAt));

  if (curationStatus === PostStatus.RESOLVED) {
    return sortedQuestions[sortedQuestions.length - 1] ?? null;
  }

  return (
    sortedQuestions.find((q) => q.resolution === null) ??
    sortedQuestions[sortedQuestions.length - 1] ??
    null
  );
}

export const generateUserForecastsForMultipleQuestion = (
  question: QuestionWithMultipleChoiceForecasts
): UserChoiceItem[] | undefined => {
  const latest = question.aggregations.recency_weighted.latest;
  const options = question.options;

  const choiceOrdering: number[] = options?.map((_, i) => i) ?? [];
  choiceOrdering.sort((a, b) => {
    const aCenter = latest?.forecast_values[a] ?? 0;
    const bCenter = latest?.forecast_values[b] ?? 0;
    return bCenter - aCenter;
  });

  return options?.map((choice, index) => {
    const userForecasts = question.my_forecasts?.history;
    const values: (number | null)[] = [];
    const timestamps: number[] = [];
    userForecasts?.forEach((forecast) => {
      if (
        timestamps.length &&
        timestamps[timestamps.length - 1] === forecast.start_time
      ) {
        // new forecast starts at the end of the previous, so overwrite values
        values[values.length - 1] = forecast.forecast_values[index] ?? null;
      } else {
        // just add the forecast
        values.push(forecast.forecast_values[index] ?? null);
        timestamps.push(forecast.start_time);
      }

      if (forecast.end_time) {
        // this forecast ends, add it to timestamps and a null value
        timestamps.push(forecast.end_time);
        values.push(null);
      }
    });
    return {
      choice,
      values: values,
      timestamps: timestamps,
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
      choice: question.label,
      values: userForecasts?.history.map((forecast) => {
        if (question.type === QuestionType.Binary) {
          return forecast.forecast_values[1] ?? 0;
        }

        if (!forecast.centers || isNil(forecast.centers[0])) {
          return 0;
        }

        const value = forecast.centers[0];
        if (scaling) {
          return unscaleNominalLocation(
            scaleInternalLocation(value, question.scaling),
            scaling
          );
        }

        return value;
      }),
      timestamps: userForecasts?.history.map((forecast) => forecast.start_time),
      color: MULTIPLE_CHOICE_COLOR_SCALE[index] ?? METAC_COLORS.gray["400"],
      unscaledValues: userForecasts?.history.map((forecast) =>
        question.type === QuestionType.Binary
          ? forecast.forecast_values[1] ?? 0
          : forecast.centers?.[0] ?? 0
      ),
    };
  });
};

export function sortGroupPredictionOptions<QT>(
  questions: QuestionWithNumericForecasts[],
  group?: PostGroupOfQuestions<QT>
) {
  return [...questions].sort((a, b) => {
    const aMean = a.aggregations.recency_weighted.latest?.centers?.[0] ?? 0;
    const bMean = b.aggregations.recency_weighted.latest?.centers?.[0] ?? 0;
    const aValueScaled = scaleInternalLocation(aMean, {
      range_min: a.scaling?.range_min ?? 0,
      range_max: a.scaling?.range_max ?? 1,
      zero_point: a.scaling?.zero_point ?? null,
    });
    const bValueScaled = scaleInternalLocation(bMean, {
      range_min: b.scaling?.range_min ?? 0,
      range_max: b.scaling?.range_max ?? 1,
      zero_point: b.scaling?.zero_point ?? null,
    });

    const aResTime = new Date(a.scheduled_resolve_time).getTime();
    const bResTime = new Date(b.scheduled_resolve_time).getTime();

    // Default sorting to CP descending if no order is specified
    if (!group?.subquestions_order) {
      return bValueScaled - aValueScaled;
    }

    let subquestions_order = group?.subquestions_order;

    // If this is a FanGraph, always sort manually
    if (group?.graph_type === GroupOfQuestionsGraphType.FanGraph) {
      subquestions_order = PostGroupOfQuestionsSubquestionsOrder.MANUAL;
    }

    switch (subquestions_order) {
      case PostGroupOfQuestionsSubquestionsOrder.CP_ASC:
        return aValueScaled - bValueScaled;
      case PostGroupOfQuestionsSubquestionsOrder.CP_DESC:
        return bValueScaled - aValueScaled;
      default:
        return (a.group_rank ?? aResTime) - (b.group_rank ?? bResTime);
    }
  });
}

export function getQuestionLinearChartType(
  questionType: QuestionType
): QuestionLinearGraphType | null {
  let type: QuestionLinearGraphType | null;
  switch (questionType) {
    case QuestionType.Binary:
      type = "binary";
      break;
    case QuestionType.Date:
    case QuestionType.Numeric:
      type = "continuous";
      break;
    default:
      type = null;
  }

  return type;
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
  option: ContinuousGroupOption
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

export function getGroupForecastAvailability(
  groupQuestions: QuestionWithForecasts[]
): ForecastAvailability {
  const cpRevealTimes: Array<{ raw: string; formatted: number }> = [];
  for (const q of groupQuestions) {
    if (q.cp_reveal_time) {
      cpRevealTimes.push({
        raw: q.cp_reveal_time,
        formatted: new Date(q.cp_reveal_time).getTime(),
      });
    }
  }

  let closestCPRevealTime: string | null = null;
  if (cpRevealTimes.length) {
    const minDate = Math.min(...cpRevealTimes.map((t) => t.formatted));
    const candidate = cpRevealTimes.find((t) => t.formatted === minDate);
    if (candidate && isValid(new Date(candidate.raw))) {
      closestCPRevealTime = candidate.raw;
    }
  }

  return {
    isEmpty: groupQuestions.every(getIsQuestionForecastEmpty),
    cpRevealsOn:
      closestCPRevealTime && new Date(closestCPRevealTime) >= new Date()
        ? closestCPRevealTime
        : null,
  };
}

export function getQuestionForecastAvailability(
  question: QuestionWithForecasts
): ForecastAvailability {
  return {
    isEmpty: getIsQuestionForecastEmpty(question),
    cpRevealsOn:
      question.cp_reveal_time && new Date(question.cp_reveal_time) >= new Date()
        ? question.cp_reveal_time
        : null,
  };
}

const getIsQuestionForecastEmpty = (question: QuestionWithForecasts): boolean =>
  !question.aggregations.recency_weighted.history.length &&
  !question.my_forecasts?.history.length;

export const formatValueUnit = (value: string, unit?: string) => {
  if (!unit) return value;

  return unit === "%" ? `${value}%` : `${value} ${unit}`;
};

export const isUnitCompact = (unit?: string) =>
  unit && unit.length <= QUESTION_UNIT_COMPACT_LENGTH;
