import { type ReactNode, Suspense } from "react";

import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import {
  MultiLineChart,
  type MultiLineChartColor,
  type MultiLineChartProps,
  type MultiLineChartSeries,
} from "./multi-line-chart";
import {
  createMultiQuestionLineXAxis,
  fetchMultiQuestionDataset,
  type MultiQuestionResolvedRow,
  type MultiQuestionRowConfig,
} from "./multi-question-data";
import { NoQuestionPlaceholder } from "./placeholder";
import { MoreButton } from "./question-card";

const DEFAULT_SERIES_COLORS: MultiLineChartColor[] = [
  "blue",
  "green",
  "red",
  "gray",
];

type SeriesOverride = Partial<
  Omit<MultiLineChartSeries, "id" | "label" | "data" | "color">
> & {
  color?: MultiLineChartColor;
};

type MultiQuestionLineChartProps = {
  title?: string;
  rows: MultiQuestionRowConfig[];
  className?: string;
  note?: ReactNode;
  showMoreButton?: boolean;
  getSeriesOptions?: (
    row: MultiQuestionResolvedRow,
    index: number
  ) => SeriesOverride | undefined;
} & Omit<
  MultiLineChartProps,
  | "series"
  | "xTickValues"
  | "formatXTick"
  | "highlightedX"
  | "onHighlightedXChange"
>;

function buildSeriesFromDatasetRows(
  rows: MultiQuestionResolvedRow[],
  columns: string[],
  getSeriesOptions?: (
    row: MultiQuestionResolvedRow,
    index: number
  ) => SeriesOverride | undefined
) {
  const { xTickValues, getXForLabel, formatXTick } =
    createMultiQuestionLineXAxis(columns);

  const series = rows.map<MultiLineChartSeries>((row, index) => {
    const overrides = getSeriesOptions?.(row, index);

    return {
      id: String(row.questionId),
      label: row.title,
      color:
        overrides?.color ??
        DEFAULT_SERIES_COLORS[index % DEFAULT_SERIES_COLORS.length] ??
        "blue",
      dataLabels: overrides?.dataLabels,
      filled: overrides?.filled ?? false,
      dashed: overrides?.dashed,
      dotSize: overrides?.dotSize,
      legendStyle: overrides?.legendStyle,
      dataLabelPlacement: overrides?.dataLabelPlacement,
      dataLabelTransparent: overrides?.dataLabelTransparent,
      dataLabelClassName: overrides?.dataLabelClassName,
      dataLabelRectClassName: overrides?.dataLabelRectClassName,
      dataLabelTextClassName: overrides?.dataLabelTextClassName,
      data: columns.flatMap((label, columnIndex) => {
        const value = row.values[label];
        if (value == null) return [];

        return [
          {
            x: getXForLabel(label, columnIndex),
            y: value,
          },
        ];
      }),
    };
  });

  return {
    series,
    xTickValues,
    formatXTick,
  };
}

async function MultiQuestionLineChartContent({
  title,
  rows,
  className,
  note,
  showMoreButton = true,
  getSeriesOptions,
  ...chartProps
}: MultiQuestionLineChartProps) {
  const postIds = rows.map((row) => row.questionId);

  let dataset;
  try {
    dataset = await fetchMultiQuestionDataset(rows);
  } catch (error) {
    logError(error);
    return (
      <div className={className}>
        <NoQuestionPlaceholder />
      </div>
    );
  }

  const { series, xTickValues, formatXTick } = buildSeriesFromDatasetRows(
    dataset.rows,
    dataset.columns,
    getSeriesOptions
  );

  return (
    <>
      <div className={cn("group/card relative", className)}>
        {showMoreButton && postIds.length > 0 && (
          <div className="absolute right-4 top-4 z-10 [visibility:var(--ss-hidden,visible)] print:hidden">
            <MoreButton postIds={postIds} postTitle={title} />
          </div>
        )}
        {title && (
          <h3 className="mb-4 mt-0 w-full pr-8 text-base font-[450] leading-tight text-gray-800 [text-wrap:pretty] dark:text-gray-800-dark">
            {title}
          </h3>
        )}
        <MultiLineChart
          {...chartProps}
          series={series}
          xTickValues={xTickValues}
          formatXTick={formatXTick}
        />
      </div>
      {note && (
        <div className="!mt-2 text-sm text-blue-700 dark:text-blue-700-dark">
          {note}
        </div>
      )}
    </>
  );
}

function MultiQuestionLineChartSkeleton({ className }: { className?: string }) {
  return (
    <div
      className={`animate-pulse overflow-hidden rounded bg-blue-200 p-4 dark:bg-blue-800 md:p-5 ${className ?? ""}`}
    >
      <div className="mb-4 h-5 w-2/3 rounded bg-gray-300 dark:bg-gray-600" />
      <div className="h-64 rounded bg-gray-300 dark:bg-gray-600" />
    </div>
  );
}

export function MultiQuestionLineChart(props: MultiQuestionLineChartProps) {
  return (
    <Suspense
      fallback={<MultiQuestionLineChartSkeleton className={props.className} />}
    >
      <MultiQuestionLineChartContent {...props} />
    </Suspense>
  );
}
