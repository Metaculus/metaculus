import { type ReactNode } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { type QuestionWithNumericForecasts } from "@/types/question";

import { getSubQuestionValue } from "../../helpers/fetch-jobs-data";

export type MultiQuestionRowConfig = {
  questionId: number;
  title: string;
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

export function sortMultiQuestionLabels(labels: string[]): string[] {
  return [...labels].sort((a, b) => labelCollator.compare(a, b));
}

export async function fetchMultiQuestionDataset(
  rows: MultiQuestionRowConfig[]
): Promise<MultiQuestionDataset> {
  const postIds = rows.map((row) => row.questionId);
  const { results: posts } = await ServerPostsApi.getPostsWithCP({
    ids: postIds,
    limit: postIds.length,
  });

  const postsById = new Map(posts.map((post) => [post.id, post]));
  const labelsSet = new Set<string>();

  for (const row of rows) {
    for (const label of Object.keys(row.historicalValues ?? {})) {
      labelsSet.add(label);
    }
  }

  for (const post of posts) {
    const questions = post.group_of_questions?.questions;
    if (!questions) continue;
    for (const question of questions) {
      if (question.label) labelsSet.add(question.label);
    }
  }

  const columns = sortMultiQuestionLabels(Array.from(labelsSet));
  const resolvedRows = rows.map((row) => {
    const post = postsById.get(row.questionId);
    const questions = post?.group_of_questions?.questions as
      | QuestionWithNumericForecasts[]
      | undefined;
    const questionByLabel = new Map(
      questions?.map((question) => [question.label, question]) ?? []
    );

    const values = Object.fromEntries(
      columns.map((label) => {
        if (
          Object.prototype.hasOwnProperty.call(
            row.historicalValues ?? {},
            label
          )
        ) {
          return [label, row.historicalValues?.[label] ?? null];
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
