"use client";

import { getUnixTime } from "date-fns";
import { isNil, merge, uniq } from "lodash";
import React, { FC, useEffect, useMemo, useState } from "react";
import {
  CursorCoordinatesPropType,
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
import PredictionWithRange from "@/components/charts/primitives/prediction_with_range";
import XTickLabel from "@/components/charts/primitives/x_tick_label";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import { TimelineChartZoomOption } from "@/types/charts";
import { Resolution } from "@/types/post";
import {
  AggregateForecastHistory,
  QuestionType,
  Scaling,
  UserForecastHistory,
} from "@/types/question";
import { getAxisLeftPadding, getTickLabelFontSize } from "@/utils/charts/axis";
import { getResolutionPoint } from "@/utils/charts/resolution";

import { buildNumericChartData } from "./helpers";

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
  inboundOutcomeCount?: number | null;
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
  inboundOutcomeCount,
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
      buildNumericChartData({
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
        inboundOutcomeCount,
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
      inboundOutcomeCount,
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
    if (
      !resolution ||
      resolution === "" ||
      !resolveTime ||
      isNil(actualCloseTime)
    ) {
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
                onMouseOutCapture: () => {
                  if (!onCursorChange) return;
                  setIsCursorActive(false);
                },
                onMouseEnter: () => {
                  if (!onCursorChange) return;
                  setIsCursorActive(true);
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

export default React.memo(NumericChart);
