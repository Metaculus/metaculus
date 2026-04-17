import { type ReactNode } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { type QuestionWithNumericForecasts } from "@/types/question";

import {
  type DataLabelMode,
  type MultiLineChartColor,
} from "./multi_line_chart.types";
import { getSubQuestionValue } from "../../helpers/fetch_jobs_data";

export type MultiQuestionRowConfig = {
  /** Omit for a static-only series whose values come entirely from historicalValues. */
  questionId?: number;
  title: string;
  /** When set, used for this series in the chart (see also getSeriesOptions on MultiQuestionLineChart). */
  color?: MultiLineChartColor;
  /** Render this series as a dashed line. */
  dashed?: boolean;
  /** Per-point dot radius. Set to 0 to hide dots. */
  dotSize?: number;
  /** Controls data-label visibility for this series (default: hover). Use "never" to suppress. */
  dataLabels?: DataLabelMode;
  staticValue?: ReactNode;
  historicalValues?: Record<string, number | null>;
};

export type MultiQuestionResolvedRow = MultiQuestionRowConfig & {
  values: Record<string, number | null>;
};

export type MultiQuestionDataset = {
  columns: string[];
  postIds: number[];
  rows: MultiQuestionResolvedRow[];
};

const labelCollator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: "base",
});

// Collapses short fiscal-year-style labels like "2024-25" into "2025"
// (pattern: 4 digits, hyphen, 2 digits -> first 2 digits + trailing 2 digits).
const YEAR_RANGE_LABEL_PATTERN = /^(\d{2})\d{2}-(\d{2})$/;

export function normalizeMultiQuestionLabel(label: string): string {
  const match = YEAR_RANGE_LABEL_PATTERN.exec(label);
  if (match) {
    return `${match[1]}${match[2]}`;
  }
  return label;
}

export function sortMultiQuestionLabels(labels: string[]): string[] {
  return [...labels].sort((a, b) => labelCollator.compare(a, b));
}

export async function fetchMultiQuestionDataset(
  rows: MultiQuestionRowConfig[]
): Promise<MultiQuestionDataset> {
  const postIds = rows
    .map((row) => row.questionId)
    .filter((id): id is number => id != null);
  const { results: posts } = postIds.length
    ? await ServerPostsApi.getPostsWithCP({
        ids: postIds,
        limit: postIds.length,
      })
    : { results: [] };

  const postsById = new Map(posts.map((post) => [post.id, post]));
  const labelsSet = new Set<string>();

  for (const row of rows) {
    for (const label of Object.keys(row.historicalValues ?? {})) {
      labelsSet.add(normalizeMultiQuestionLabel(label));
    }
  }

  for (const post of posts) {
    const questions = post.group_of_questions?.questions;
    if (!questions) continue;
    for (const question of questions) {
      if (question.label) {
        labelsSet.add(normalizeMultiQuestionLabel(question.label));
      }
    }
  }

  const columns = sortMultiQuestionLabels(Array.from(labelsSet));
  const resolvedRows = rows.map((row) => {
    const post =
      row.questionId != null ? postsById.get(row.questionId) : undefined;
    const questions = post?.group_of_questions?.questions as
      | QuestionWithNumericForecasts[]
      | undefined;
    const questionByLabel = new Map(
      questions?.map((question) => [
        normalizeMultiQuestionLabel(question.label ?? ""),
        question,
      ]) ?? []
    );
    const historicalByLabel = new Map(
      Object.entries(row.historicalValues ?? {}).map(([label, value]) => [
        normalizeMultiQuestionLabel(label),
        value,
      ])
    );

    const values = Object.fromEntries(
      columns.map((label) => {
        if (historicalByLabel.has(label)) {
          return [label, historicalByLabel.get(label) ?? null];
        }

        const question = questionByLabel.get(label);
        return [label, question ? getSubQuestionValue(question) : null];
      })
    ) as Record<string, number | null>;

    return {
      ...row,
      values,
    };
  });

  return {
    columns,
    postIds,
    rows: resolvedRows,
  };
}

export function createMultiQuestionLineXAxis(columns: string[]) {
  const areAllLabelsNumeric = columns.every(
    (label) => !Number.isNaN(Number(label))
  );
  const xTickValues = areAllLabelsNumeric
    ? columns.map((label) => Number(label))
    : columns.map((_, index) => index + 1);
  const labelByXValue = new Map(
    xTickValues.map((xValue, index) => [
      xValue,
      columns[index] ?? String(xValue),
    ])
  );

  return {
    xTickValues,
    getXForLabel: (label: string, index: number) =>
      areAllLabelsNumeric ? Number(label) : index + 1,
    formatXTick: (xValue: number) =>
      labelByXValue.get(xValue) ?? String(xValue),
  };
}
