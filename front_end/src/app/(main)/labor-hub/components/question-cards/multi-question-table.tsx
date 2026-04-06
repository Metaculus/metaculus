import { ReactNode, Suspense } from "react";

import ServerPostsApi from "@/services/api/posts/posts.server";
import { QuestionWithNumericForecasts } from "@/types/question";
import { logError } from "@/utils/core/errors";

import { NoQuestionPlaceholder } from "./placeholder";
import {
  PercentageChange,
  TableCompact,
  TableCompactBody,
  TableCompactCell,
  TableCompactHead,
  TableCompactHeaderCell,
  TableCompactRow,
  WageValue,
} from "../../components/table-compact";
import { getSubQuestionValue } from "../../helpers/fetch-jobs-data";

type ValueFormat = "percentage" | "percentageChange" | "wage" | "number";

function FormattedValue({
  value,
  format,
  decimals = 1,
}: {
  value: number;
  format: ValueFormat;
  decimals?: number;
}) {
  const rounded = Number(value.toFixed(decimals));
  switch (format) {
    case "percentage":
      return <>{rounded}%</>;
    case "percentageChange":
      return <PercentageChange value={rounded} />;
    case "wage":
      return <WageValue value={rounded} />;
    case "number":
      return <>{rounded}</>;
  }
}

type TableRowConfig = {
  questionId: number;
  title: string;
  staticValue?: ReactNode;
};

type MultiQuestionTableProps = {
  title?: string;
  rows: TableRowConfig[];
  staticColumnHeader?: string;
  firstColumnHeader?: string;
  valueFormat?: ValueFormat;
  decimals?: number;
  className?: string;
};

async function MultiQuestionTableContent({
  title,
  rows,
  staticColumnHeader,
  firstColumnHeader,
  valueFormat = "percentage",
  decimals = 1,
  className,
}: MultiQuestionTableProps) {
  let posts;
  try {
    const allIds = rows.map((r) => r.questionId);
    const { results } = await ServerPostsApi.getPostsWithCP({
      ids: allIds,
      limit: allIds.length,
    });
    posts = results;
  } catch (error) {
    logError(error);
    return (
      <TableCompact title={title} className={className}>
        <TableCompactBody>
          <TableCompactRow>
            <TableCompactCell>
              <NoQuestionPlaceholder />
            </TableCompactCell>
          </TableCompactRow>
        </TableCompactBody>
      </TableCompact>
    );
  }

  const postsById = new Map(posts.map((p) => [p.id, p]));

  // Collect all unique sub-question labels across posts
  const labelsSet = new Set<string>();
  for (const post of posts) {
    const questions = post.group_of_questions?.questions;
    if (!questions) continue;
    for (const q of questions) {
      if (q.label) labelsSet.add(q.label);
    }
  }
  const columns = Array.from(labelsSet).sort();

  const hasStaticColumn = rows.some((r) => r.staticValue != null);

  return (
    <TableCompact
      title={title}
      className={className}
      HeadingSection={
        title ? (
          <h3 className="mb-4 mt-0 w-full pr-8 text-base font-[450] leading-tight text-gray-800 [text-wrap:pretty] dark:text-gray-800-dark">
            {title}
          </h3>
        ) : undefined
      }
    >
      <TableCompactHead>
        <TableCompactRow>
          <TableCompactHeaderCell className="w-[40%]">
            {firstColumnHeader ?? ""}
          </TableCompactHeaderCell>
          {hasStaticColumn && (
            <TableCompactHeaderCell className="w-[15%] text-right">
              {staticColumnHeader ?? "Current"}
            </TableCompactHeaderCell>
          )}
          {columns.map((col) => (
            <TableCompactHeaderCell key={col} className="text-right">
              {col}
            </TableCompactHeaderCell>
          ))}
        </TableCompactRow>
      </TableCompactHead>
      <TableCompactBody>
        {rows.map((row) => {
          const post = postsById.get(row.questionId);
          const questions = post?.group_of_questions?.questions as
            | QuestionWithNumericForecasts[]
            | undefined;
          const questionByLabel = new Map(
            questions?.map((q) => [q.label, q]) ?? []
          );

          return (
            <TableCompactRow key={row.questionId}>
              <TableCompactCell>{row.title}</TableCompactCell>
              {hasStaticColumn && (
                <TableCompactCell className="text-right">
                  {row.staticValue}
                </TableCompactCell>
              )}
              {columns.map((col) => {
                const q = questionByLabel.get(col);
                const value = q ? getSubQuestionValue(q) : null;
                return (
                  <TableCompactCell key={col} className="text-right">
                    {value != null ? (
                      <FormattedValue
                        value={value}
                        format={valueFormat}
                        decimals={decimals}
                      />
                    ) : (
                      <span className="text-gray-400 dark:text-gray-500">
                        —
                      </span>
                    )}
                  </TableCompactCell>
                );
              })}
            </TableCompactRow>
          );
        })}
      </TableCompactBody>
    </TableCompact>
  );
}

function MultiQuestionTableSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse overflow-hidden rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5 ${className ?? ""}`}
    >
      <div className="mb-4 h-5 w-2/3 rounded bg-gray-300 dark:bg-gray-600" />
      <div className="flex flex-col gap-3">
        <div className="h-4 w-full rounded bg-gray-300 dark:bg-gray-600" />
        <div className="h-4 w-full rounded bg-gray-300 dark:bg-gray-600" />
        <div className="h-4 w-3/4 rounded bg-gray-300 dark:bg-gray-600" />
      </div>
    </div>
  );
}

export function MultiQuestionTable(props: MultiQuestionTableProps) {
  return (
    <Suspense
      fallback={<MultiQuestionTableSkeleton className={props.className} />}
    >
      <MultiQuestionTableContent {...props} />
    </Suspense>
  );
}
