import { type ReactNode } from "react";

import cn from "@/utils/core/cn";

import { FlippableMultiQuestionCardClient } from "./flippable_multi_question_card_client";
import { type FlipSide } from "./flippable_question_card";
import {
  MultiQuestionLineChart,
  type MultiQuestionLineChartProps,
} from "./multi_question_line_chart";
import {
  MultiQuestionTable,
  type MultiQuestionTableProps,
} from "./multi_question_table";

const CHART_CARD_CLASSNAME =
  "break-inside-avoid overflow-hidden rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5 print:border print:border-gray-300";

export type FlippableMultiQuestionCardProps = {
  title?: ReactNode;
  rows: MultiQuestionTableProps["rows"];
  note?: ReactNode;
  className?: string;
  prefer?: "timeline" | "table";
  defaultSide?: FlipSide;
  tableHistoricalValueKeys?: string[];
  tableProps?: Omit<MultiQuestionTableProps, "title" | "rows" | "note">;
  chartProps?: Omit<MultiQuestionLineChartProps, "title" | "rows" | "note">;
};

export function FlippableMultiQuestionCard({
  title,
  rows,
  note,
  className,
  prefer,
  defaultSide = "left",
  tableHistoricalValueKeys,
  tableProps,
  chartProps,
}: FlippableMultiQuestionCardProps) {
  const resolvedDefaultSide =
    prefer != null ? (prefer === "timeline" ? "right" : "left") : defaultSide;

  return (
    <>
      <FlippableMultiQuestionCardClient
        className={className}
        defaultSide={resolvedDefaultSide}
        leftContent={
          <MultiQuestionTable
            {...tableProps}
            title={title}
            rows={rows}
            historicalValueKeys={tableHistoricalValueKeys}
          />
        }
        rightContent={
          <MultiQuestionLineChart
            {...chartProps}
            title={title}
            rows={rows}
            height={chartProps?.height ?? 250}
            className={cn(CHART_CARD_CLASSNAME, chartProps?.className)}
          />
        }
      />
      {note && (
        <div className="!mt-2 text-sm text-blue-700 dark:text-blue-700-dark">
          {note}
        </div>
      )}
    </>
  );
}
