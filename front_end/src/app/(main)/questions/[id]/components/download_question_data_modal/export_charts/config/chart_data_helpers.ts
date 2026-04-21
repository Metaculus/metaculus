import { isNil } from "lodash";
import { useTranslations } from "next-intl";

import { ChoiceItem } from "@/types/choices";
import {
  ConditionalPost,
  GroupOfQuestionsPost,
  PostWithForecasts,
} from "@/types/post";
import {
  QuestionType,
  QuestionWithMultipleChoiceForecasts,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts/timestamps";
import { getPredictionDisplayValue } from "@/utils/formatters/prediction";
import { formatResolution } from "@/utils/formatters/resolution";
import { scaleInternalLocation } from "@/utils/math";
import {
  generateChoiceItemsFromGroupQuestions,
  generateChoiceItemsFromMultipleChoiceForecast,
} from "@/utils/questions/choices";
import {
  checkGroupOfQuestionsPostType,
  isConditionalPost,
  isGroupOfQuestionsPost,
  isQuestionPost,
} from "@/utils/questions/helpers";
import {
  isResolved,
  isSuccessfullyResolved,
} from "@/utils/questions/resolution";

import { ExportableChartType, getExportQuestion } from "./chart_exportables";
import { generateBarTableSvg } from "../svg_generators/bar_table_svg";
import {
  generateRadialGaugeResolvedSvg,
  generateRadialGaugeSvg,
} from "../svg_generators/radial_gauge_svg";

export function getAggregationTimestamps(post: PostWithForecasts): number[] {
  if (isGroupOfQuestionsPost(post)) {
    const groupPost =
      post as GroupOfQuestionsPost<QuestionWithNumericForecasts>;
    return getGroupQuestionsTimestamps(groupPost.group_of_questions.questions);
  }
  if (isConditionalPost(post)) {
    const conditionalPost =
      post as ConditionalPost<QuestionWithNumericForecasts>;
    return getGroupQuestionsTimestamps([
      conditionalPost.conditional.question_yes,
      conditionalPost.conditional.question_no,
    ]);
  }
  return [];
}

export function getChoiceItems(
  post: PostWithForecasts,
  t: ReturnType<typeof useTranslations>,
  ifYesLabel = "If yes",
  ifNoLabel = "If no",
  activeCount?: number,
  locale = "en"
): ChoiceItem[] {
  if (isQuestionPost(post)) {
    if (post.question.type === QuestionType.MultipleChoice) {
      const mcQuestion =
        post.question as unknown as QuestionWithMultipleChoiceForecasts;
      return generateChoiceItemsFromMultipleChoiceForecast(mcQuestion, t, {
        activeCount,
      });
    }
  }
  if (isGroupOfQuestionsPost(post)) {
    const groupPost =
      post as GroupOfQuestionsPost<QuestionWithNumericForecasts>;
    return generateChoiceItemsFromGroupQuestions(
      groupPost.group_of_questions.questions,
      { activeCount, locale }
    );
  }
  if (isConditionalPost(post)) {
    const conditionalPost =
      post as ConditionalPost<QuestionWithNumericForecasts>;
    const items = generateChoiceItemsFromGroupQuestions(
      [
        conditionalPost.conditional.question_yes,
        conditionalPost.conditional.question_no,
      ],
      { locale }
    );
    // Sub-questions have empty labels — use "If yes" / "If no"
    if (items[0] && !items[0].choice) items[0].choice = ifYesLabel;
    if (items[1] && !items[1].choice) items[1].choice = ifNoLabel;
    return items;
  }
  return [];
}

export function getBarTableRows(
  post: PostWithForecasts,
  t: ReturnType<typeof useTranslations>,
  compact: boolean,
  ifYesLabel = "If yes",
  ifNoLabel = "If no",
  locale = "en"
): { label: string; value: number; displayValue: string; color: string }[] {
  const choiceItems = getChoiceItems(
    post,
    t,
    ifYesLabel,
    ifNoLabel,
    undefined,
    locale
  );
  if (!choiceItems.length) return [];

  const numericType = getNumericGroupQuestionType(post);

  const rows = numericType
    ? buildNumericBarTableRows(choiceItems, numericType, t)
    : buildPercentageBarTableRows(choiceItems);

  if (!compact) return rows;

  const visibleCount = rows.length === 5 ? 5 : 4;
  const visible = rows.slice(0, visibleCount);
  if (rows.length > visibleCount) {
    const othersCount = rows.length - visibleCount;
    const othersLabel = `${othersCount} others`;
    if (numericType) {
      visible.push({
        label: othersLabel,
        value: 0,
        displayValue: "",
        color: "#91999E",
      });
    } else {
      const othersValue = rows
        .slice(visibleCount)
        .reduce((sum, r) => sum + r.value, 0);
      visible.push({
        label: othersLabel,
        value: othersValue,
        displayValue: `${Math.round(othersValue)}%`,
        color: "#91999E",
      });
    }
  }
  return visible;
}

function getNumericGroupQuestionType(
  post: PostWithForecasts
): QuestionType.Date | QuestionType.Numeric | null {
  if (!isGroupOfQuestionsPost(post)) return null;
  if (checkGroupOfQuestionsPostType(post, QuestionType.Date)) {
    return QuestionType.Date;
  }
  if (checkGroupOfQuestionsPostType(post, QuestionType.Numeric)) {
    return QuestionType.Numeric;
  }
  return null;
}

function buildPercentageBarTableRows(choiceItems: ChoiceItem[]) {
  return choiceItems
    .map((item) => {
      const lastValue = item.aggregationValues.at(-1);
      const value = lastValue != null ? lastValue * 100 : 0;
      const resolvedDisplay = getResolvedDisplayValue(item);
      return {
        label: item.choice,
        value,
        displayValue: resolvedDisplay ?? `${Math.round(value)}%`,
        color: item.color.DEFAULT,
      };
    })
    .sort((a, b) => b.value - a.value);
}

function getResolvedDisplayValue(item: ChoiceItem): string | null {
  if (isNil(item.resolution)) return null;
  if (typeof item.displayedResolution === "string") {
    return item.displayedResolution;
  }
  return String(item.resolution);
}

function buildNumericBarTableRows(
  choiceItems: ChoiceItem[],
  questionType: QuestionType.Date | QuestionType.Numeric,
  t: ReturnType<typeof useTranslations>
) {
  const entries = choiceItems.map((item) => {
    const rawValue = item.aggregationValues.at(-1) ?? null;
    const scaling: Scaling = {
      range_min: item.scaling?.range_min ?? 0,
      range_max: item.scaling?.range_max ?? 1,
      zero_point: item.scaling?.zero_point ?? null,
    };
    const scaledValue = !isNil(rawValue)
      ? scaleInternalLocation(rawValue, scaling)
      : NaN;
    const resolvedDisplay = getResolvedDisplayValue(item);
    const displayValue =
      resolvedDisplay ??
      getPredictionDisplayValue(rawValue, {
        questionType,
        scaling,
        actual_resolve_time: item.actual_resolve_time ?? null,
        unit: item.unit,
        emptyLabel: t("Upcoming"),
      });
    return { item, scaledValue, displayValue };
  });

  const validScaled = entries
    .filter((e) => isNil(e.item.resolution) && !Number.isNaN(e.scaledValue))
    .map((e) => e.scaledValue);
  const maxScaled = validScaled.length ? Math.max(...validScaled) : 0;
  const minScaled = validScaled.length ? Math.min(...validScaled) : 0;

  return entries
    .map(({ item, scaledValue, displayValue }) => ({
      label: item.choice,
      value: !isNil(item.resolution)
        ? 100
        : calculateRelativeBarWidth(scaledValue, maxScaled, minScaled),
      displayValue,
      color: item.color.DEFAULT,
    }))
    .sort((a, b) => b.value - a.value);
}

function calculateRelativeBarWidth(
  scaledValue: number,
  maxScaled: number,
  minScaled: number
): number {
  if (Number.isNaN(scaledValue)) return 0;
  if (maxScaled === 0 && minScaled < 0) {
    return scaledValue === 0 ? 100 : (1 - scaledValue / minScaled) * 100;
  }
  if (minScaled < 0) {
    const totalRange = maxScaled - minScaled;
    return totalRange > 0 ? ((scaledValue - minScaled) / totalRange) * 100 : 0;
  }
  return maxScaled > 0 ? (scaledValue / maxScaled) * 100 : 0;
}

export function tryGenerateProgrammaticSvg(
  post: PostWithForecasts,
  t: ReturnType<typeof useTranslations>,
  chartType: ExportableChartType,
  ifYesLabel = "If yes",
  ifNoLabel = "If no",
  resolvedLabel = "Resolved",
  locale = "en"
): string | null {
  if (chartType === ExportableChartType.RadialForecast) {
    const question = getExportQuestion(post);
    if (!question) return null;

    if (isResolved(question.resolution)) {
      const formattedResolution = formatResolution({
        resolution: question.resolution,
        questionType: question.type,
        scaling: question.scaling,
        locale,
        unit: question.unit,
        actual_resolve_time: question.actual_resolve_time ?? null,
      });
      return generateRadialGaugeResolvedSvg(
        formattedResolution,
        isSuccessfullyResolved(question.resolution),
        resolvedLabel
      );
    }

    const cp =
      question.aggregations[question.default_aggregation_method]?.latest
        ?.centers?.[0];
    if (cp == null) return null;
    const cpPercentage = Math.round((cp as number) * 1000) / 10;
    const isClosed = question.status === "closed";
    return generateRadialGaugeSvg(cpPercentage, isClosed);
  }

  if (
    chartType === ExportableChartType.TableTop4 ||
    chartType === ExportableChartType.FullTable
  ) {
    const compact = chartType === ExportableChartType.TableTop4;
    const rows = getBarTableRows(
      post,
      t,
      compact,
      ifYesLabel,
      ifNoLabel,
      locale
    );
    if (!rows.length) return null;
    return generateBarTableSvg(rows);
  }

  return null;
}
