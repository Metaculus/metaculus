import { ContinuousAreaGraphInput } from "@/components/charts/continuous_area_chart";
import { METAC_COLORS } from "@/constants/colors";
import { ContinuousAreaType } from "@/types/charts";
import { PostWithForecasts, QuestionStatus } from "@/types/post";
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
  // Binary subquestions (e.g. binary fan-graph groups) have no continuous
  // distribution — their aggregation has no forecast_values.
  if (
    question.type !== QuestionType.Numeric &&
    question.type !== QuestionType.Discrete &&
    question.type !== QuestionType.Date
  ) {
    return [];
  }
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

// A group can show Distributions only when its subquestions are continuous
// (Numeric/Discrete/Date — excludes binary time-series groups) AND at least one
// subquestion actually has distribution data. Fan graphs are allowed here (a
// numeric fan graph qualifies; a binary one does not).
export function hasGroupDistributions(post: PostWithForecasts): boolean {
  if (!isGroupOfQuestionsPost(post)) {
    return false;
  }
  const isContinuousType =
    checkGroupOfQuestionsPostType(post, QuestionType.Numeric) ||
    checkGroupOfQuestionsPostType(post, QuestionType.Discrete) ||
    checkGroupOfQuestionsPostType(post, QuestionType.Date);
  if (!isContinuousType) {
    return false;
  }
  return (post.group_of_questions?.questions ?? []).some(
    hasSubquestionDistribution
  );
}
