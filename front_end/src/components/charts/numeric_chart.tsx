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
import { getUnixTime } from "date-fns";
import {
  QuestionType,
  Aggregations,
  UserForecastHistory,
  Scaling,
} from "@/types/question";
import {
  generateNumericDomain,
  generateTicksY,
  generateTimestampXScale,
  getDisplayValue,
  unscaleNominalLocation,
} from "@/utils/charts";

import XTickLabel from "./primitives/x_tick_label";

type Props = {
  aggregations: Aggregations;
  myForecasts?: UserForecastHistory;
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  yLabel?: string;
  height?: number;
  onCursorChange?: (value: number | null) => void;
  onChartReady?: () => void;
  questionType: QuestionType;
  actualCloseTime: number | null;
  scaling: Scaling;
  extraTheme?: VictoryThemeDefinition;
  resolution?: Resolution | null;
  resolveTime?: string | null;
};

const NumericChart: FC<Props> = ({
  aggregations,
  myForecasts,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker = false,
  yLabel,
  height = 150,
  onCursorChange,
  onChartReady,
  questionType,
  actualCloseTime,
  scaling,
  extraTheme,
  resolution,
  resolveTime,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const defaultCursor = Date.now() / 1000;

  const [isCursorActive, setIsCursorActive] = useState(false);

  const [zoom, setZoom] = useState(defaultZoom);
  const { line, area, yDomain, xDomain, xScale, yScale, points } = useMemo(
    () =>
      buildChartData({
        questionType,
        actualCloseTime,
        scaling,
        height,
        aggregations,
        myForecasts,
        width: chartWidth,
        zoom,
      }),
    [
      height,
      chartWidth,
      zoom,
      aggregations,
      actualCloseTime,
      myForecasts,
      questionType,
      scaling,
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
          const closestForecast = aggregations.recency_weighted.history.reduce(
            (prev, curr) =>
              Math.abs(curr.start_time - value) <
              Math.abs(prev.start_time - value)
                ? curr
                : prev
          );

          onCursorChange(closestForecast.start_time);
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
                onMouseLeave: () => {
                  if (!onCursorChange) return;
                  onCursorChange(null);
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
            data={points}
            dataComponent={<PredictionWithRange />}
          />

          {resolution && !!resolveTime && (
            <VictoryScatter
              data={getResolutionData({
                questionType,
                resolution,
                resolveTime: Math.min(
                  getUnixTime(resolveTime),
                  actualCloseTime! / 1000
                ),
                scaling,
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
  actualCloseTime,
  scaling,
  height,
  aggregations,
  myForecasts,
  width,
  zoom,
}: {
  questionType: QuestionType;
  actualCloseTime: number | null;
  scaling: Scaling;
  height: number;
  aggregations: Aggregations;
  myForecasts?: UserForecastHistory;
  width: number;
  zoom: TimelineChartZoomOption;
}): ChartData {
  const aggregation = aggregations.recency_weighted;
  const line = aggregation.history.map((forecast) => ({
    x: forecast.start_time,
    y: forecast.centers![0],
  }));
  const area = aggregation.history.map((forecast) => ({
    x: forecast.start_time,
    y0: forecast.interval_lower_bounds![0],
    y: forecast.interval_upper_bounds![0],
  }));
  const latestTimestamp = actualCloseTime
    ? Math.min(actualCloseTime / 1000, Date.now() / 1000)
    : Date.now() / 1000;
  if (aggregation.latest) {
    line.push({
      x: latestTimestamp,
      y: aggregation.latest.centers![0],
    });
    area.push({
      x: latestTimestamp,
      y0: aggregation.latest.interval_lower_bounds![0],
      y: aggregation.latest.interval_upper_bounds![0],
    });
  }

  let points: Line = [];
  if (myForecasts?.history.length) {
    points = myForecasts.history.map((forecast) => ({
      x: forecast.start_time,
      y:
        questionType === "binary"
          ? forecast.forecast_values[1]
          : forecast.centers![0],
      y1:
        questionType === "binary"
          ? undefined
          : forecast.interval_lower_bounds?.[0],
      y2:
        questionType === "binary"
          ? undefined
          : forecast.interval_upper_bounds?.[0],
    }));
  }
  // TODO: add quartiles if continuous

  const domainTimestamps = [
    ...aggregation.history.map((f) => f.start_time),
    ...(myForecasts?.history
      ? myForecasts.history.map((f) => f.start_time)
      : []),
    latestTimestamp,
  ];
  const xDomain = generateNumericDomain(domainTimestamps, zoom);
  const xScale = generateTimestampXScale(xDomain, width);

  const yDomain: Tuple<number> = [0, 1];

  const desiredMajorTicks = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const desiredMajorTickDistance = 20;

  const { ticks, majorTicks } = generateTicksY(
    height,
    desiredMajorTicks,
    desiredMajorTickDistance
  );
  const tickFormat = (value: number): string => {
    if (!majorTicks.includes(value)) {
      return "";
    }
    return getDisplayValue(value, questionType, scaling);
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

export function getResolutionData({
  questionType,
  resolution,
  resolveTime,
  scaling,
}: {
  questionType: QuestionType;
  resolution: Resolution;
  resolveTime: number;
  scaling: Scaling;
}) {
  switch (questionType) {
    case QuestionType.Binary: {
      // format data for binary question
      return [
        {
          y:
            resolution === "no"
              ? scaling.range_min ?? 0
              : scaling.range_max ?? 1,
          x: resolveTime,
          symbol: "diamond",
          size: 4,
        },
      ];
    }
    case QuestionType.Numeric: {
      // format data for numerical question
      const unscaledResolution = unscaleNominalLocation(
        Number(resolution),
        scaling
      );

      return [
        {
          y: unscaledResolution,
          x: resolveTime,
          symbol: "diamond",
          size: 4,
        },
      ];
    }
    case QuestionType.Date: {
      // format data for date question
      const dateTimestamp = new Date(resolution).getTime() / 1000;
      const unscaledResolution = unscaleNominalLocation(dateTimestamp, scaling);

      return [
        {
          y: unscaledResolution,
          x: resolveTime,
          symbol: "diamond",
          size: 4,
        },
      ];
    }
    default:
      return;
  }
}

const PredictionWithRange: React.FC<any> = ({
  x,
  y,
  datum: { y1, y2 },
  scale,
}) => {
  const { getThemeColor } = useAppTheme();
  const y1Scaled = scale.y(y1);
  const y2Scaled = scale.y(y2);
  return (
    <>
      {y1 !== undefined && y2 !== undefined && (
        <line
          x1={x}
          x2={x}
          y1={y1Scaled}
          y2={y2Scaled}
          stroke={getThemeColor(METAC_COLORS.orange["700"])}
          strokeWidth={2}
        />
      )}
      <circle
        cx={x}
        cy={y}
        r={3}
        fill={getThemeColor(METAC_COLORS.gray["0"])}
        stroke={getThemeColor(METAC_COLORS.orange["700"])}
        strokeWidth={2}
      />
    </>
  );
};

export default React.memo(NumericChart);
