import { type ReactNode, Suspense } from "react";

import cn from "@/utils/core/cn";
import { logError } from "@/utils/core/errors";

import {
  type MultiLineChartColor,
  type MultiLineChartProps,
  type MultiLineChartSeries,
} from "./multi_line_chart";
import {
  createMultiQuestionLineXAxis,
  fetchMultiQuestionDataset,
  type MultiQuestionResolvedRow,
  type MultiQuestionRowConfig,
} from "./multi_question_data";
import { MultiQuestionLineChartClient } from "./multi_question_line_chart_client";
import { reactNodeToText } from "./multi_question_table";
import { NoQuestionPlaceholder } from "./placeholder";
import { MoreButton } from "./question_card";

const DEFAULT_SERIES_COLORS: MultiLineChartColor[] = [
  "mc1",
  "mc4",
  "mc5",
  "mc6",
  "mc7",
  "mc8",
  "mc9",
  "mc10",
  "mc11",
  "mc12",
  "mc13",
  "mc14",
  "mc15",
  "mc16",
  "mc17",
  "mc18",
];

type MultiQuestionLineChartValueFormat =
  | "percentage"
  | "percentageChange"
  | "number";

type SeriesOverride = Partial<
  Omit<MultiLineChartSeries, "id" | "label" | "data" | "color">
> & {
  color?: MultiLineChartColor;
};

export type MultiQuestionLineChartProps = {
  title?: ReactNode;
  rows: MultiQuestionRowConfig[];
  className?: string;
  note?: ReactNode;
  showMoreButton?: boolean;
  valueFormat?: MultiQuestionLineChartValueFormat;
  decimals?: number;
  historicalTickEvery?: number;
  getSeriesOptions?: (
    row: MultiQuestionResolvedRow,
    index: number
  ) => SeriesOverride | undefined;
} & Omit<
  MultiLineChartProps,
  | "series"
  | "xTickValues"
  | "formatXTick"
  | "formatYValue"
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
  const { xTickValues, getXForLabel } = createMultiQuestionLineXAxis(columns);
  const xTickLabelsByValue = Object.fromEntries(
    xTickValues.map((xValue, index) => [
      String(xValue),
      columns[index] ?? String(xValue),
    ])
  );

  const series = rows.map<MultiLineChartSeries>((row, index) => {
    const overrides = getSeriesOptions?.(row, index);
    const historicalValues = row.historicalValues ?? {};

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
      legendDetail: overrides?.legendDetail,
      dataLabelPlacement: overrides?.dataLabelPlacement,
      dataLabelTransparent: overrides?.dataLabelTransparent,
      dataLabelClassName: overrides?.dataLabelClassName,
      dataLabelRectClassName: overrides?.dataLabelRectClassName,
      dataLabelTextClassName: overrides?.dataLabelTextClassName,
      data: columns.flatMap((label, columnIndex) => {
        const value = row.values[label];
        if (value == null) return [];
        const isHistoricalPoint = Object.prototype.hasOwnProperty.call(
          historicalValues,
          label
        );

        return [
          {
            x: getXForLabel(label, columnIndex),
            y: value,
            filled: isHistoricalPoint ? true : undefined,
            dotSize: isHistoricalPoint ? 4 : undefined,
          },
        ];
      }),
    };
  });

  return {
    series,
    xTickValues,
    xTickLabelsByValue,
  };
}

function getHistoricalForecastDividerX(
  columns: string[],
  historicalLabelSet: Set<string>
) {
  if (!historicalLabelSet.size) return null;

  const currentYear = new Date().getFullYear();
  const areAllLabelsNumeric = columns.every(
    (label) => !Number.isNaN(Number(label))
  );
  const { getXForLabel } = createMultiQuestionLineXAxis(columns);
  const lastHistoricalIndex = columns.reduce<number>(
    (lastIndex, label, index) =>
      historicalLabelSet.has(label) ? index : lastIndex,
    -1
  );

  if (lastHistoricalIndex < 0 || lastHistoricalIndex >= columns.length - 1) {
    return null;
  }

  const nextForecastIndex = columns.findIndex(
    (label, index) =>
      index > lastHistoricalIndex && !historicalLabelSet.has(label)
  );

  if (nextForecastIndex === -1) return null;

  const lastHistoricalX = getXForLabel(
    columns[lastHistoricalIndex] ?? "",
    lastHistoricalIndex
  );
  const nextForecastX = getXForLabel(
    columns[nextForecastIndex] ?? "",
    nextForecastIndex
  );

  if (
    areAllLabelsNumeric &&
    currentYear > lastHistoricalX &&
    currentYear < nextForecastX
  ) {
    return currentYear;
  }

  return (lastHistoricalX + nextForecastX) / 2;
}

async function MultiQuestionLineChartContent({
  title,
  rows,
  className,
  note,
  showMoreButton = true,
  valueFormat = "percentageChange",
  decimals = 1,
  historicalTickEvery,
  getSeriesOptions,
  ...chartProps
}: MultiQuestionLineChartProps) {
  const postIds = rows.map((row) => row.questionId);
  const titleText = reactNodeToText(title);

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

  const { series, xTickValues, xTickLabelsByValue } =
    buildSeriesFromDatasetRows(dataset.rows, dataset.columns, getSeriesOptions);
  const historicalLabelSet = new Set(
    rows.flatMap((row) => Object.keys(row.historicalValues ?? {}))
  );
  const historicalForecastDividerX = getHistoricalForecastDividerX(
    dataset.columns,
    historicalLabelSet
  );
  const visibleXTickValues =
    historicalTickEvery && historicalTickEvery > 1
      ? xTickValues.filter((xTickValue) => {
          const label = xTickLabelsByValue[String(xTickValue)];
          if (!label || !historicalLabelSet.has(label)) return true;

          const historicalIndex = dataset.columns
            .filter((column) => historicalLabelSet.has(column))
            .indexOf(label);

          return (
            historicalIndex === -1 ||
            historicalIndex % historicalTickEvery === 0
          );
        })
      : xTickValues;

  return (
    <>
      <div className={cn("group/card relative", className)}>
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
        <MultiQuestionLineChartClient
          {...chartProps}
          series={series}
          xTickValues={xTickValues}
          visibleXTickValues={visibleXTickValues}
          xTickLabelsByValue={xTickLabelsByValue}
          historicalForecastDividerX={historicalForecastDividerX}
          valueFormat={valueFormat}
          decimals={decimals}
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
      data-loading="true"
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
