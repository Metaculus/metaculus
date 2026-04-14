import { Children, isValidElement, type ReactNode, Suspense } from "react";

import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import {
  fetchMultiQuestionDataset,
  type MultiQuestionRowConfig,
} from "./multi_question_data";
import {
  PercentageChange,
  TableCompact,
  TableCompactBody,
  TableCompactCell,
  TableCompactHead,
  TableCompactHeaderCell,
  TableCompactRow,
  WageValue,
} from "../../components/table_compact";
import { NoQuestionPlaceholder } from "../question_cards/placeholder";
import { MoreButton } from "../question_cards/question_card";

export function reactNodeToText(node: ReactNode): string {
  return Children.toArray(node)
    .map((child) => {
      if (typeof child === "string" || typeof child === "number") {
        return String(child);
      }

      if (isValidElement<{ children?: ReactNode }>(child)) {
        return reactNodeToText(child.props.children);
      }

      return "";
    })
    .join("");
}

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

export type MultiQuestionTableProps = {
  title?: ReactNode;
  rows: MultiQuestionRowConfig[];
  historicalValueKeys?: string[];
  staticColumnHeader?: string;
  firstColumnHeader?: string;
  valueFormat?: ValueFormat;
  decimals?: number;
  className?: string;
  note?: ReactNode;
  showMoreButton?: boolean;
};

async function MultiQuestionTableContent({
  title,
  rows,
  historicalValueKeys,
  staticColumnHeader,
  firstColumnHeader,
  valueFormat = "percentage",
  decimals = 1,
  className,
  note,
  showMoreButton = true,
}: MultiQuestionTableProps) {
  const postIds = rows.map((r) => r.questionId);
  const titleText = reactNodeToText(title);

  let dataset;
  try {
    dataset = await fetchMultiQuestionDataset(rows);
  } catch (error) {
    logError(error);
    return (
      <TableCompact title={titleText} className={className}>
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

  const hasStaticColumn = dataset.rows.some((row) => row.staticValue != null);
  const historicalLabelSet = new Set(
    rows.flatMap((row) => Object.keys(row.historicalValues ?? {}))
  );
  const historicalValueKeySet = historicalValueKeys
    ? new Set(historicalValueKeys)
    : null;
  const displayedColumns = dataset.columns.filter((label) => {
    if (!historicalLabelSet.has(label)) return true;
    return historicalValueKeySet?.has(label) ?? true;
  });

  return (
    <>
      <TableCompact
        title={titleText}
        className={cn("group/card relative", className)}
        HeadingSection={
          <>
            {showMoreButton && postIds.length > 0 && (
              <div className="absolute right-4 top-4 z-10 [visibility:var(--ss-hidden,visible)] print:hidden">
                <MoreButton postIds={postIds} postTitle={titleText} />
              </div>
            )}
            {title && (
              <h3 className="mb-4 mt-0 w-full pr-8 text-base font-[450] leading-tight text-gray-800 [text-wrap:pretty] dark:text-gray-800-dark">
                {title}
              </h3>
            )}
          </>
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
            {displayedColumns.map((col) => (
              <TableCompactHeaderCell key={col} className="text-right">
                {col}
              </TableCompactHeaderCell>
            ))}
          </TableCompactRow>
        </TableCompactHead>
        <TableCompactBody>
          {dataset.rows.map((row) => {
            return (
              <TableCompactRow key={row.questionId}>
                <TableCompactCell>{row.title}</TableCompactCell>
                {hasStaticColumn && (
                  <TableCompactCell className="text-right">
                    {row.staticValue}
                  </TableCompactCell>
                )}
                {displayedColumns.map((col) => {
                  const value = row.values[col] ?? null;
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
      {note && (
        <div className="!mt-2 text-sm text-blue-700 dark:text-blue-700-dark">
          {note}
        </div>
      )}
    </>
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
