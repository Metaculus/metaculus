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
} from "@/types/question";
import { getGroupQuestionsTimestamps } from "@/utils/charts/timestamps";
import { formatResolution } from "@/utils/formatters/resolution";
import {
  generateChoiceItemsFromGroupQuestions,
  generateChoiceItemsFromMultipleChoiceForecast,
} from "@/utils/questions/choices";
import {
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
  activeCount?: number
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
      { activeCount }
    );
  }
  if (isConditionalPost(post)) {
    const conditionalPost =
      post as ConditionalPost<QuestionWithNumericForecasts>;
    const items = generateChoiceItemsFromGroupQuestions([
      conditionalPost.conditional.question_yes,
      conditionalPost.conditional.question_no,
    ]);
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
  ifNoLabel = "If no"
): { label: string; value: number; color: string }[] {
  const choiceItems = getChoiceItems(post, t, ifYesLabel, ifNoLabel);
  if (!choiceItems.length) return [];

  const rows = choiceItems
    .map((item) => {
      const lastValue = item.aggregationValues.at(-1);
      return {
        label: item.choice,
        value: lastValue != null ? lastValue * 100 : 0,
        color: item.color.DEFAULT,
      };
    })
    .sort((a, b) => b.value - a.value);

  if (!compact) return rows;

  const visibleCount = rows.length === 5 ? 5 : 4;
  const visible = rows.slice(0, visibleCount);
  if (rows.length > visibleCount) {
    const othersValue = rows
      .slice(visibleCount)
      .reduce((sum, r) => sum + r.value, 0);
    const othersCount = rows.length - visibleCount;
    visible.push({
      label: `${othersCount} others`,
      value: othersValue,
      color: "#91999E",
    });
  }
  return visible;
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
    const rows = getBarTableRows(post, t, compact, ifYesLabel, ifNoLabel);
    if (!rows.length) return null;
    return generateBarTableSvg(rows);
  }

  return null;
}
