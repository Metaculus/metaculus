"use client";

import { merge } from "lodash";
import React, { FC, useEffect, useMemo, useState } from "react";
import {
  CursorCoordinatesPropType,
  LineSegment,
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
import { lightTheme, darkTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import {
  Scale,
  TimelineChartZoomOption,
  TickFormat,
  ChartProps,
  ForecastTimelineData,
  Interval,
} from "@/types/charts";
import { generateNumericDomain, generateTimestampXScale } from "@/utils/charts";

import ChartContainer from "./primitives/chart_container";
import ChartCursorLabel from "./primitives/chart_cursor_label";
import XTickLabel from "./primitives/x_tick_label";

import { Tuple } from "victory";

import { Scaling } from "@/types/question";
import { QuestionType } from "@/types/question";
import { getDisplayValue } from "@/utils/charts";

type Props = {
  forecastTimelines: ForecastTimelineData[];
  questionType: QuestionType;
  scaling: Scaling;
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  yLabel?: string;
  height?: number;
  onCursorChange?: (value: number, format: TickFormat) => void;
  onChartReady?: () => void;
  extraTheme?: VictoryThemeDefinition;
};

const MultiForecastTimeline: FC<Props> = ({
  forecastTimelines,
  questionType,
  scaling,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker,
  yLabel,
  height = 150,
  onCursorChange,
  onChartReady,
  extraTheme,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const defaultCursor = Math.max(
    ...forecastTimelines.map(
      (forecastTimeline) =>
        forecastTimeline.timestamps[forecastTimeline.timestamps.length - 1]
    )
  );
  const [isCursorActive, setIsCursorActive] = useState(false);

  const [zoom, setZoom] = useState(defaultZoom);

  const prevWidth = usePrevious(chartWidth);
  useEffect(() => {
    if (!prevWidth && chartWidth && onChartReady) {
      onChartReady();
    }
  }, [onChartReady, prevWidth, chartWidth]);

  const allTimestamps = forecastTimelines
    .map((forecastTimeline) => forecastTimeline.timestamps)
    .flat()
    .sort((a, b) => a - b);
  const chartProps = getChartProperties({
    allTimestamps,
    zoom,
    chartWidth,
    questionType,
    scaling,
    height,
  });

  const isHighlightActive = useMemo(
    () =>
      Object.values(forecastTimelines).some(({ highlighted }) => highlighted),
    [forecastTimelines]
  );

  const CursorContainer = (
    <VictoryCursorContainer
      key={"cursor-container"}
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
            : chartProps.xScale.cursorFormat?.(datum.x) ??
                chartProps.xScale.tickFormat(datum.x);
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
          const closestTimestamp = allTimestamps.reduce((prev, curr) =>
            Math.abs(curr - value) < Math.abs(prev - value) ? curr : prev
          );

          onCursorChange(closestTimestamp);
        }
      }}
    />
  );

  const shouldDisplayChart =
    !!chartWidth &&
    !!chartProps.xScale.ticks.length &&
    chartProps.yScale.ticks.length;

  return (
    <ChartContainer
      ref={chartContainerRef}
      height={height}
      zoom={withZoomPicker ? zoom : undefined}
      onZoomChange={setZoom}
    >
      {true && (
        <VictoryChart
          key={"my_chart"}
          domain={{ y: chartProps.yDomain, x: chartProps.xDomain }}
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
          {forecastTimelines.map(
            ({
              label,
              color,
              symbol,
              highlighted,
              active,
              timestamps,
              centers,
              uppers,
              lowers,
              resolutionPoint,
            }) => {
              const intervals: Interval = timestamps.map(
                (timestamp, index) => ({
                  x: timestamp,
                  y: centers[index],
                  lower: lowers?.[index],
                  upper: uppers?.[index],
                })
              );
              if (intervals.length === 0) return null;
              if (symbol !== undefined)
                return (
                  <VictoryScatter
                    key={"user-forecast-" + label}
                    data={intervals}
                    style={{
                      data: {
                        stroke: color.DEFAULT,
                        fill: "none",
                        strokeWidth: 2.5,
                      },
                    }}
                  />
                );
              return (
                <React.Fragment key={"forecast-" + label}>
                  <VictoryLine
                    key={"line-" + label}
                    data={intervals}
                    style={{
                      data: {
                        strokeWidth: 1.5,
                        stroke: active ? color.DEFAULT : "transparent",
                        strokeOpacity: !isHighlightActive
                          ? 1
                          : highlighted
                            ? 1
                            : 0.2,
                      },
                    }}
                    interpolation="stepAfter"
                  />
                  {resolutionPoint && (
                    <VictoryScatter
                      key={"resolution-" + label}
                      data={[
                        {
                          x: resolutionPoint.time,
                          y: resolutionPoint.value,
                          symbol: "diamond",
                        },
                      ]}
                      style={{
                        data: {
                          stroke: color.DEFAULT,
                          fill: "none",
                          strokeWidth: 2.5,
                        },
                      }}
                    />
                  )}
                  {intervals[0].lower !== undefined && highlighted && (
                    <VictoryArea
                      key={"area-" + label}
                      data={intervals.map(({ x, lower, upper }) => ({
                        x,
                        y: lower,
                        y1: upper,
                      }))}
                      style={{
                        data: {
                          fill: color.DEFAULT,
                          opacity: 0.3,
                        },
                      }}
                      interpolation="stepAfter"
                    />
                  )}
                </React.Fragment>
              );
            }
          )}

          <VictoryAxis
            dependentAxis
            style={{
              tickLabels: { padding: 2 },
            }}
            tickValues={chartProps.yScale.ticks}
            tickFormat={chartProps.yScale.tickFormat}
            label={yLabel}
            offsetX={48}
            axisLabelComponent={<VictoryLabel dy={-10} />}
          />
          <VictoryAxis
            tickValues={chartProps.xScale.ticks}
            tickFormat={
              isCursorActive ? () => "" : chartProps.xScale.tickFormat
            }
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

type GetChartPropertiesProps = {
  allTimestamps: number[];
  zoom: TimelineChartZoomOption;
  chartWidth: number;
  questionType: QuestionType;
  scaling: Scaling;
  height: number;
};

function getChartProperties({
  allTimestamps,
  zoom,
  chartWidth,
  questionType,
  scaling,
  height,
}: GetChartPropertiesProps): ChartProps {
  const xDomain = generateNumericDomain(allTimestamps, zoom);
  const xScale = generateTimestampXScale(xDomain, chartWidth);
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
    return getDisplayValue(
      value,
      questionType,
      scaling.range_min,
      scaling.range_max,
      scaling.zero_point
    );
  };
  const yScale: Scale = {
    ticks,
    tickFormat,
  };

  return {
    xScale,
    yScale,
    xDomain,
    yDomain,
  };
}

export default MultiForecastTimeline;
