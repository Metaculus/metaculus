"use client";

import { merge } from "lodash";
import React, { FC, useEffect, useMemo, useState } from "react";
import {
  CursorCoordinatesPropType,
  DomainTuple,
  LineSegment,
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryCursorContainer,
  VictoryLabel,
  VictoryLabelProps,
  VictoryLine,
  VictoryScatter,
  VictoryThemeDefinition,
} from "victory";

import ChartContainer from "@/components/charts/primitives/chart_container";
import ChartCursorLabel from "@/components/charts/primitives/chart_cursor_label";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import {
  Area,
  BaseChartData,
  Line,
  Scale,
  TimelineChartZoomOption,
} from "@/types/charts";
import { Resolution } from "@/types/post";
import { NumericForecast, QuestionType } from "@/types/question";
import {
  generateNumericDomain,
  generateTimestampXScale,
  getDisplayValue,
  scaleResolutionLocation,
} from "@/utils/charts";

import XTickLabel from "./primitives/x_tick_label";

type Props = {
  dataset: NumericForecast;
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  yLabel?: string;
  height?: number;
  onCursorChange?: (value: number) => void;
  onChartReady?: () => void;
  questionType: QuestionType;
  rangeMin: number | null;
  rangeMax: number | null;
  zeroPoint: number | null;
  extraTheme?: VictoryThemeDefinition;
  resolution?: Resolution | null;
  derivRatio?: number;
};

const NumericChart: FC<Props> = ({
  dataset,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker = false,
  yLabel,
  height = 150,
  onCursorChange,
  onChartReady,
  questionType,
  rangeMin,
  rangeMax,
  zeroPoint,
  extraTheme,
  resolution,
  derivRatio,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const defaultCursor = useMemo(
    () => Math.max(...dataset.timestamps),
    [dataset.timestamps]
  );
  const [isCursorActive, setIsCursorActive] = useState(false);

  const [zoom, setZoom] = useState(defaultZoom);
  const { line, area, yDomain, xDomain, xScale, yScale, points } = useMemo(
    () =>
      buildChartData({
        questionType,
        rangeMin,
        rangeMax,
        zeroPoint,
        height,
        dataset,
        width: chartWidth,
        zoom,
      }),
    [
      questionType,
      rangeMin,
      rangeMax,
      zeroPoint,
      height,
      dataset,
      chartWidth,
      zoom,
    ]
  );

  const prevWidth = usePrevious(chartWidth);
  useEffect(() => {
    if (!prevWidth && chartWidth && onChartReady) {
      onChartReady();
    }
  }, [onChartReady, prevWidth, chartWidth]);

  const CursorContainer = (
    <VictoryCursorContainer
      cursorDimension={"x"}
      defaultCursorValue={defaultCursor}
      cursorLabelOffset={{
        x: 0,
        y: 0,
      }}
      cursorLabel={({ datum }: VictoryLabelProps) => {
        if (datum) {
          return datum.x === defaultCursor
            ? "now"
            : xScale.cursorFormat?.(datum.x) ?? xScale.tickFormat(datum.x);
        }
      }}
      cursorComponent={
        <LineSegment
          style={{
            stroke: getThemeColor(METAC_COLORS.gray["600"]),
            strokeDasharray: "2,1",
          }}
        />
      }
      cursorLabelComponent={<ChartCursorLabel positionY={height - 10} />}
      onCursorChange={(value: CursorCoordinatesPropType) => {
        if (typeof value === "number" && onCursorChange) {
          const closestTimestamp = dataset.timestamps.reduce((prev, curr) =>
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
          );

          onCursorChange(closestTimestamp);
        }
      }}
    />
  );

  const shouldDisplayChart =
    !!chartWidth && !!xScale.ticks.length && yScale.ticks.length;

  return (
    <ChartContainer
      ref={chartContainerRef}
      height={height}
      zoom={withZoomPicker ? zoom : undefined}
      onZoomChange={setZoom}
    >
      {shouldDisplayChart && (
        <VictoryChart
          domain={{ y: yDomain, x: xDomain }}
          width={chartWidth}
          height={height}
          theme={actualTheme}
          events={[
            {
              target: "parent",
              eventHandlers: {
                onMouseOverCapture: () => {
                  if (!onCursorChange) return;
                  setIsCursorActive(true);
                },
                onMouseOutCapture: () => {
                  if (!onCursorChange) return;
                  setIsCursorActive(false);
                },
              },
            },
          ]}
          containerComponent={onCursorChange ? CursorContainer : undefined}
        >
          <VictoryArea
            data={area}
            style={{
              data: {
                fill: getThemeColor(METAC_COLORS.olive["500"]),
                opacity: 0.3,
              },
            }}
            interpolation="stepAfter"
          />
          <VictoryLine
            data={line}
            style={{
              data: {
                strokeWidth: 1.5,
                stroke: getThemeColor(METAC_COLORS.olive["700"]),
              },
            }}
            interpolation="stepAfter"
          />
          <VictoryScatter
            data={points.map((x) => ({ ...x, symbol: "diamond" }))}
            style={{
              data: {
                stroke: getThemeColor(METAC_COLORS.orange["700"]),
                fill: "none",
                strokeWidth: 2,
              },
            }}
          />

          {resolution && (
            <VictoryScatter
              data={getResolutionData({
                questionType,
                resolution,
                dataset,
                rangeMin,
                rangeMax,
                derivRatio,
              })}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS.purple["800"]),
                  fill: "none",
                  strokeWidth: 2.5,
                },
              }}
            />
          )}

          <VictoryAxis
            dependentAxis
            style={{
              tickLabels: { padding: 2 },
            }}
            tickValues={yScale.ticks}
            tickFormat={yScale.tickFormat}
            label={yLabel}
            offsetX={48}
            axisLabelComponent={<VictoryLabel dy={-10} />}
          />
          <VictoryAxis
            tickValues={xScale.ticks}
            tickFormat={isCursorActive ? () => "" : xScale.tickFormat}
            tickLabelComponent={
              <XTickLabel
                chartWidth={chartWidth}
                withCursor={!!onCursorChange}
              />
            }
          />
        </VictoryChart>
      )}
    </ChartContainer>
  );
};

type ChartData = BaseChartData & {
  line: Line;
  area: Area;
  points: Line;
  yDomain: DomainTuple;
  xDomain: DomainTuple;
};

function buildChartData({
  questionType,
  rangeMin,
  rangeMax,
  zeroPoint,
  height,
  dataset,
  width,
  zoom,
}: {
  questionType: QuestionType;
  rangeMin: number | null;
  rangeMax: number | null;
  zeroPoint: number | null;
  height: number;
  dataset: NumericForecast;
  width: number;
  zoom: TimelineChartZoomOption;
}): ChartData {
  const { timestamps, medians, q1s, q3s, my_forecasts } = dataset;

  const line = timestamps.map((timestamp, index) => ({
    x: timestamp,
    y: medians[index],
  }));
  const area = timestamps.map((timestamp, index) => ({
    x: timestamp,
    y0: q1s[index],
    y: q3s[index],
  }));

  let points: Line = [];
  if (my_forecasts !== null) {
    points = my_forecasts.timestamps.map((timestamp, index) => ({
      x: timestamp,
      y: my_forecasts.medians[index],
    }));
  }

  const domainTimestamps = [...timestamps, ...(my_forecasts?.timestamps ?? [])];
  const xDomain = generateNumericDomain(domainTimestamps, zoom);
  const xScale = generateTimestampXScale(xDomain, width);

  const yDomain: Tuple<number> = [0, 1];

  const desiredMajorTicks = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const minorTicksPerMajor = 9;
  const desiredMajorTickDistance = 20;

  const maxMajorTicks = Math.floor(height / desiredMajorTickDistance);

  let majorTicks = desiredMajorTicks;
  if (maxMajorTicks < desiredMajorTicks.length) {
    // adjust major ticks on small height
    const step = 1 / (maxMajorTicks - 1);
    majorTicks = Array.from({ length: maxMajorTicks }, (_, i) => i * step);
  }
  const ticks = [];
  for (let i = 0; i < majorTicks.length - 1; i++) {
    ticks.push(majorTicks[i]);
    const step = (majorTicks[i + 1] - majorTicks[i]) / (minorTicksPerMajor + 1);
    for (let j = 1; j <= minorTicksPerMajor; j++) {
      ticks.push(majorTicks[i] + step * j);
    }
  }
  ticks.push(majorTicks[majorTicks.length - 1]);

  const tickFormat = (value: number): string => {
    if (!majorTicks.includes(value)) {
      return "";
    }
    return getDisplayValue(value, questionType, rangeMin, rangeMax, zeroPoint);
  };
  const yScale: Scale = {
    ticks,
    tickFormat,
  };

  return {
    line,
    area,
    yDomain,
    xDomain,
    xScale,
    yScale,
    points,
  };
}

function getResolutionData({
  questionType,
  resolution,
  dataset,
  rangeMin,
  rangeMax,
  derivRatio,
}: {
  questionType: QuestionType;
  resolution: Resolution;
  rangeMin: number | null;
  rangeMax: number | null;
  dataset: NumericForecast;
  derivRatio?: number;
}) {
  switch (questionType) {
    case QuestionType.Binary: {
      // format data for binary question
      return [
        {
          y: resolution === "no" ? rangeMin ?? 0 : rangeMax ?? 1,
          x: dataset.timestamps.at(-1),
          symbol: "diamond",
          size: 4,
        },
      ];
    }
    case QuestionType.Numeric: {
      // format data for numerical question
      const scaledResolution = scaleResolutionLocation(
        Number(resolution),
        rangeMin ?? 0,
        rangeMax ?? 1,
        derivRatio
      );

      return [
        {
          y: scaledResolution,
          x: dataset.timestamps.at(-1),
          symbol: "diamond",
          size: 4,
        },
      ];
    }
    case QuestionType.Date: {
      // format data for date question
      const dateTimestamp = new Date(resolution).getTime() / 1000;
      const scaledResolution = scaleResolutionLocation(
        dateTimestamp,
        rangeMin ?? 0,
        rangeMax ?? 1,
        derivRatio
      );

      return [
        {
          y: scaledResolution,
          x: dataset.timestamps.at(-1),
          symbol: "diamond",
          size: 4,
        },
      ];
    }
    default:
      return;
  }
}

export default React.memo(NumericChart);
