"use client";

import { getUnixTime } from "date-fns";
import { isNil, merge, uniq } from "lodash";
import React, { FC, useEffect, useMemo, useState } from "react";
import {
  CursorCoordinatesPropType,
  DomainTuple,
  LineSegment,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
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
import {
  AggregateForecastHistory,
  QuestionType,
  Scaling,
  UserForecastHistory,
} from "@/types/question";
import {
  generateNumericXDomain,
  generateScale,
  generateTimestampXScale,
  generateTimeSeriesYDomain,
  getAxisLeftPadding,
  getTickLabelFontSize,
} from "@/utils/charts/axis";
import { getResolutionPoint } from "@/utils/charts/resolution";

import XTickLabel from "./primitives/x_tick_label";

type Props = {
  aggregation: AggregateForecastHistory;
  aggregationIndex?: number;
  myForecasts?: UserForecastHistory;
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  yLabel?: string;
  height?: number;
  onCursorChange?: (value: number | null) => void;
  onChartReady?: () => void;
  questionType: QuestionType;
  actualCloseTime: number | null | undefined;
  scaling: Scaling;
  extraTheme?: VictoryThemeDefinition;
  resolution?: Resolution | null;
  resolveTime?: string | null;
  hideCP?: boolean;
  withUserForecastTimestamps?: boolean;
  isEmptyDomain?: boolean;
  openTime?: number;
  unit?: string;
};

const NumericChart: FC<Props> = ({
  aggregation,
  aggregationIndex = 0,
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
  hideCP,
  withUserForecastTimestamps,
  isEmptyDomain,
  openTime,
  unit,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;
  const tickLabelFontSize = getTickLabelFontSize(actualTheme);

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
        aggregation,
        aggregationIndex,
        myForecasts,
        width: chartWidth,
        zoom,
        extraTheme,
        isAggregationsEmpty: isEmptyDomain,
        openTime,
        unit,
      }),
    [
      questionType,
      actualCloseTime,
      scaling,
      height,
      aggregation,
      aggregationIndex,
      myForecasts,
      chartWidth,
      zoom,
      extraTheme,
      isEmptyDomain,
      openTime,
      unit,
    ]
  );
  const { leftPadding, MIN_LEFT_PADDING } = useMemo(() => {
    return getAxisLeftPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);

  const prevWidth = usePrevious(chartWidth);
  useEffect(() => {
    if (!prevWidth && chartWidth && onChartReady) {
      onChartReady();
    }
  }, [onChartReady, prevWidth, chartWidth]);

  const timestamps = useMemo(() => {
    const startTimes = withUserForecastTimestamps
      ? myForecasts?.history.map((f) => f.start_time) ?? []
      : aggregation.history.map((f) => f.start_time);
    const endTimes = withUserForecastTimestamps
      ? myForecasts?.history.map((f) => f.end_time ?? f.start_time) ?? []
      : aggregation.history.map((f) => f.end_time ?? f.start_time);

    return uniq([
      ...startTimes,
      ...endTimes,
      actualCloseTime ?? Date.now() / 1000,
    ]).sort((a, b) => a - b);
  }, [
    actualCloseTime,
    aggregation.history,
    withUserForecastTimestamps,
    myForecasts?.history,
  ]);

  const CursorContainer = (
    <VictoryCursorContainer
      cursorDimension={"x"}
      defaultCursorValue={defaultCursor}
      style={{
        touchAction: "pan-y",
      }}
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
          onCursorChange(
            timestamps[timestamps.findIndex((t) => t > value) - 1] ?? null
          );
        }
      }}
    />
  );

  const shouldDisplayChart =
    !!chartWidth && !!xScale.ticks.length && yScale.ticks.length;

  const resolutionPoint = useMemo(() => {
    if (!resolution || !resolveTime || isNil(actualCloseTime)) {
      return null;
    }

    return getResolutionPoint({
      questionType,
      resolution,
      resolveTime: Math.min(getUnixTime(resolveTime), actualCloseTime / 1000),
      scaling,
    });
  }, [actualCloseTime, questionType, resolution, resolveTime, scaling]);

  return (
    <ChartContainer
      ref={chartContainerRef}
      height={height}
      zoom={withZoomPicker ? zoom : undefined}
      onZoomChange={setZoom}
    >
      {shouldDisplayChart && (
        <VictoryChart
          domain={{
            y: yDomain,
            x: xDomain,
          }}
          width={chartWidth}
          height={height}
          theme={actualTheme}
          padding={{
            left: Math.max(leftPadding, MIN_LEFT_PADDING),
            top: 10,
            right: 10,
            bottom: 20,
          }}
          events={[
            {
              target: "parent",
              eventHandlers: {
                onTouchStart: () => {
                  if (!onCursorChange) return;
                  setIsCursorActive(true);
                },
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
          containerComponent={
            onCursorChange ? (
              CursorContainer
            ) : (
              <VictoryContainer
                style={{
                  pointerEvents: "auto",
                  userSelect: "auto",
                  touchAction: "auto",
                }}
              />
            )
          }
        >
          {!hideCP && (
            <VictoryArea
              data={area}
              style={{
                data: {
                  opacity: 0.3,
                },
              }}
              interpolation="stepAfter"
            />
          )}
          {!hideCP && (
            <VictoryLine
              data={line}
              style={{
                data: {
                  strokeWidth: 1.5,
                },
              }}
              interpolation="stepAfter"
            />
          )}

          <VictoryScatter
            data={points}
            dataComponent={<PredictionWithRange />}
          />

          {!!resolutionPoint && (
            <VictoryScatter
              data={[resolutionPoint]}
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
            offsetX={Math.max(leftPadding - 2, MIN_LEFT_PADDING - 2)}
            axisLabelComponent={
              <VictoryLabel
                dy={-Math.max(leftPadding - 40, MIN_LEFT_PADDING - 40)}
              />
            }
          />
          <VictoryAxis
            tickValues={xScale.ticks}
            tickFormat={isCursorActive ? () => "" : xScale.tickFormat}
            tickLabelComponent={
              <XTickLabel
                chartWidth={chartWidth}
                withCursor={!!onCursorChange}
                fontSize={tickLabelFontSize as number}
              />
            }
          />
        </VictoryChart>
      )}
    </ChartContainer>
  );
};

export type ChartData = BaseChartData & {
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
  aggregation,
  aggregationIndex,
  myForecasts,
  width,
  zoom,
  extraTheme,
  isAggregationsEmpty,
  openTime,
  unit,
}: {
  questionType: QuestionType;
  actualCloseTime?: number | null;
  scaling: Scaling;
  height: number;
  aggregation: AggregateForecastHistory;
  aggregationIndex: number;
  myForecasts?: UserForecastHistory;
  width: number;
  zoom: TimelineChartZoomOption;
  extraTheme?: VictoryThemeDefinition;
  isAggregationsEmpty?: boolean;
  openTime?: number;
  unit?: string;
}): ChartData {
  const line: Line = [];
  const area: Area = [];

  aggregation.history.forEach((forecast) => {
    if (!line.length) {
      line.push({
        x: forecast.start_time,
        y: forecast.centers?.[aggregationIndex] ?? 0,
      });
      area.push({
        x: forecast.start_time,
        y0: forecast.interval_lower_bounds?.[aggregationIndex] ?? 0,
        y: forecast.interval_upper_bounds?.[aggregationIndex] ?? 0,
      });
    } else if (
      line.length &&
      line[line.length - 1]?.x === forecast.start_time
    ) {
      /* eslint-disable @typescript-eslint/no-non-null-assertion */
      line[line.length - 1]!.y = forecast.centers?.[aggregationIndex] ?? 0;
      area[area.length - 1]!.y0 =
        forecast.interval_lower_bounds?.[aggregationIndex] ?? 0;
      area[area.length - 1]!.y =
        forecast.interval_upper_bounds?.[aggregationIndex] ?? 0;
      /* eslint-enable @typescript-eslint/no-non-null-assertion */
    } else {
      // pushing null data terminates previous point (if any)
      line.push({
        x: forecast.start_time,
        y: null,
      });
      area.push({
        x: forecast.start_time,
        y0: null,
        y: null,
      });
      line.push({
        x: forecast.start_time,
        y: forecast.centers?.[aggregationIndex] ?? 0,
      });
      area.push({
        x: forecast.start_time,
        y0: forecast.interval_lower_bounds?.[aggregationIndex] ?? 0,
        y: forecast.interval_upper_bounds?.[aggregationIndex] ?? 0,
      });
    }

    if (!!forecast.end_time) {
      line.push({
        x: forecast.end_time,
        y: forecast.centers?.[aggregationIndex] ?? 0,
      });
      area.push({
        x: forecast.end_time,
        y0: forecast.interval_lower_bounds?.[aggregationIndex] ?? 0,
        y: forecast.interval_upper_bounds?.[aggregationIndex] ?? 0,
      });
    }
  });

  const latestTimestamp = actualCloseTime
    ? Math.min(actualCloseTime / 1000, Date.now() / 1000)
    : Date.now() / 1000;
  if (aggregation.latest?.end_time === null) {
    line.push({
      x: latestTimestamp,
      y: aggregation.latest.centers?.[aggregationIndex] ?? 0,
    });
    area.push({
      x: latestTimestamp,
      y0: aggregation.latest.interval_lower_bounds?.[aggregationIndex] ?? 0,
      y: aggregation.latest.interval_upper_bounds?.[aggregationIndex] ?? 0,
    });
  } else if (
    aggregation.latest?.end_time &&
    aggregation.latest.end_time >= latestTimestamp
  ) {
    line[line.length - 1] = {
      x: latestTimestamp,
      y: aggregation.latest.centers?.[aggregationIndex] ?? 0,
    };
    area[area.length - 1] = {
      x: latestTimestamp,
      y0: aggregation.latest.interval_lower_bounds?.[aggregationIndex] ?? 0,
      y: aggregation.latest.interval_upper_bounds?.[aggregationIndex] ?? 0,
    };
  }

  const points: Line = [];
  if (myForecasts?.history.length) {
    myForecasts.history.forEach((forecast) => {
      const newPoint = {
        x: forecast.start_time,
        y:
          questionType === "binary"
            ? forecast.forecast_values[1] ?? null
            : forecast.centers?.[aggregationIndex] ?? 0,
        y1:
          questionType === "binary"
            ? undefined
            : forecast.interval_lower_bounds?.[aggregationIndex],
        y2:
          questionType === "binary"
            ? undefined
            : forecast.interval_upper_bounds?.[aggregationIndex],
        symbol: "circle",
      };

      if (points.length > 0) {
        // if the last forecasts terminates at the new
        // forecast's start time, replace the end point record
        // with the new point
        const lastPoint = points[points.length - 1];
        if (lastPoint?.x === newPoint.x) {
          points.pop();
        }
      }

      points.push(newPoint);
      if (!!forecast.end_time) {
        points.push({
          x: forecast.end_time,
          y: newPoint.y,
          symbol: "x",
        });
      }
    });
  }
  // TODO: add quartiles if continuous

  const domainTimestamps =
    isAggregationsEmpty && openTime
      ? [openTime / 1000, latestTimestamp]
      : [
          ...aggregation.history.map((f) => f.start_time),
          ...(myForecasts?.history
            ? myForecasts.history.map((f) => f.start_time)
            : []),
          latestTimestamp,
        ];

  const xDomain = generateNumericXDomain(domainTimestamps, zoom);
  const fontSize = extraTheme ? getTickLabelFontSize(extraTheme) : undefined;
  const xScale = generateTimestampXScale(xDomain, width, fontSize);
  // TODO: implement general scaling:
  // const xScale: Scale = generateScale({
  //   displayType: QuestionType.Date,
  //   axisLength: width,
  //   direction: "horizontal",
  //   domain: xDomain,
  // });

  const { originalYDomain, zoomedYDomain } = generateTimeSeriesYDomain({
    zoom,
    minTimestamp: xDomain[0],
    isChartEmpty: !domainTimestamps.length,
    minValues: area.map((d) => ({ timestamp: d.x, y: d.y0 })),
    maxValues: area.map((d) => ({ timestamp: d.x, y: d.y })),
    includeClosestBoundOnZoom: questionType === QuestionType.Binary,
  });
  const yScale: Scale = generateScale({
    displayType: questionType,
    axisLength: height,
    direction: "vertical",
    domain: originalYDomain,
    zoomedDomain: zoomedYDomain,
    scaling,
    unit,
  });

  return {
    line,
    area,
    yDomain: zoomedYDomain,
    xDomain,
    xScale,
    yScale,
    points,
  };
}

const PredictionWithRange: React.FC<any> = ({
  x,
  y,
  symbol,
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
      {symbol === "circle" && (
        <circle
          cx={x}
          cy={y}
          r={3}
          fill={getThemeColor(METAC_COLORS.gray["0"])}
          stroke={getThemeColor(METAC_COLORS.orange["700"])}
          strokeWidth={2}
        />
      )}

      {symbol === "x" && (
        <polygon
          points={`${x - 3},${y - 3} ${x + 3},${y + 3} ${x},${y} ${x - 3},${y + 3} ${x + 3},${y - 3} ${x},${y}`}
          r={3}
          fill={getThemeColor(METAC_COLORS.gray["0"])}
          stroke={getThemeColor(METAC_COLORS.orange["700"])}
          strokeWidth={2}
        />
      )}
    </>
  );
};

export default React.memo(NumericChart);
