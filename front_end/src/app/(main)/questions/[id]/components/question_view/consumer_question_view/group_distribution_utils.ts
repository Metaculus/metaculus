import { ContinuousAreaGraphInput } from "@/components/charts/continuous_area_chart";
import { METAC_COLORS } from "@/constants/colors";
import { ContinuousAreaType } from "@/types/charts";
import {
  GroupOfQuestionsGraphType,
  GroupOfQuestionsPost,
  PostWithForecasts,
  QuestionStatus,
} from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { cdfToPmf } from "@/utils/math";
import {
  checkGroupOfQuestionsPostType,
  isGroupOfQuestionsPost,
} from "@/utils/questions/helpers";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

// Community-only, display-only distribution for a single group subquestion.
// Deliberately excludes the user's own forecast (unlike getContinuousAreaChartData).
export function getSubquestionDistributionData(
  question: QuestionWithNumericForecasts
): ContinuousAreaGraphInput {
  if (isUnsuccessfullyResolved(question.resolution)) {
    return [];
  }

  const latest =
    question.aggregations[question.default_aggregation_method]?.latest;
  if (!latest || !isForecastActive(latest)) {
    return [];
  }

  const isResolved = question.status === QuestionStatus.RESOLVED;
  const isClosed = question.status === QuestionStatus.CLOSED;
  const type: ContinuousAreaType = isResolved
    ? "community_resolved"
    : isClosed
      ? "community_closed"
      : "community";

  return [
    {
      pmf: cdfToPmf(latest.forecast_values),
      cdf: latest.forecast_values,
      type,
    },
  ];
}

export function hasSubquestionDistribution(
  question: QuestionWithNumericForecasts
): boolean {
  return getSubquestionDistributionData(question).length > 0;
}

// Closed subquestions are shown in gray in the list, so their distribution
// should be gray too; open/resolved keep their per-row color.
export function getDistributionColor(
  question: QuestionWithNumericForecasts,
  choiceColor: ThemeColor
): ThemeColor {
  if (question.status === QuestionStatus.CLOSED) {
    return METAC_COLORS.gray["500"];
  }
  return choiceColor;
}

// Non-fan continuous (Numeric/Discrete/Date) group posts get the
// Timeline/Distributions treatment. Fan graphs use their own presentation.
export function isContinuousGroupPost(
  post: PostWithForecasts
): post is GroupOfQuestionsPost<QuestionWithNumericForecasts> {
  if (!isGroupOfQuestionsPost(post)) {
    return false;
  }
  if (
    post.group_of_questions?.graph_type === GroupOfQuestionsGraphType.FanGraph
  ) {
    return false;
  }
  return (
    checkGroupOfQuestionsPostType(post, QuestionType.Numeric) ||
    checkGroupOfQuestionsPostType(post, QuestionType.Discrete) ||
    checkGroupOfQuestionsPostType(post, QuestionType.Date)
  );
}
