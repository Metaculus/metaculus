"use client";

import { getUnixTime } from "date-fns";
import { FC, useState, useMemo, useEffect } from "react";
import {
  CursorCoordinatesPropType,
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
} from "victory";

import {
  ChartData,
  getResolutionData,
} from "@/components/charts/numeric_chart";
import ChartContainer from "@/components/charts/primitives/chart_container";
import ChartCursorLabel from "@/components/charts/primitives/chart_cursor_label";
import XTickLabel from "@/components/charts/primitives/x_tick_label";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import { Line, Scale, TimelineChartZoomOption } from "@/types/charts";
import { Resolution } from "@/types/post";
import {
  AggregateForecastHistory,
  QuestionType,
  Scaling,
} from "@/types/question";
import {
  generateNumericDomain,
  generateTicksY,
  generateTimestampXScale,
  getDisplayValue,
} from "@/utils/charts";

type Props = {
  aggregationData: AggregateForecastHistory;
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  yLabel?: string;
  height?: number;
  cursorTimestamp?: number | null;
  onCursorChange?: (value: number | null) => void;
  onChartReady?: () => void;
  onSelectTimestamp: (value: number) => void;
  questionType: QuestionType;
  actualCloseTime: number | null;
  scaling: Scaling;
  resolution?: Resolution | null;
  resolveTime?: string | null;
};

const NumericAggregationChart: FC<Props> = ({
  aggregationData,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker = false,
  cursorTimestamp,
  onCursorChange,
  onSelectTimestamp,
  onChartReady,
  questionType,
  actualCloseTime,
  scaling,
  resolution,
  resolveTime,
}) => {
  const height = 150;
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const actualTheme = theme === "dark" ? darkTheme : lightTheme;

  const defaultCursor =
    aggregationData.history[aggregationData.history.length - 1].start_time;

  const [isCursorActive, setIsCursorActive] = useState(false);

  const [zoom, setZoom] = useState(defaultZoom);
  const { line, area, yDomain, xDomain, xScale, yScale, points } = useMemo(
    () =>
      buildChartData({
        questionType,
        scaling,
        height,
        aggregationData,
        width: chartWidth,
        zoom,
      }),
    [chartWidth, zoom, aggregationData, questionType, scaling]
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
          const closestForecast = aggregationData.history.reduce(
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
                  onCursorChange(defaultCursor);
                },
                onClick: () => {
                  onSelectTimestamp(cursorTimestamp ? cursorTimestamp : 0);
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
            // label={yLabel}
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

export default NumericAggregationChart;

function buildChartData({
  questionType,
  // actualCloseTime,
  scaling,
  height,
  aggregationData,
  width,
  zoom,
}: {
  questionType: QuestionType;
  scaling: Scaling;
  height: number;
  aggregationData: AggregateForecastHistory;
  width: number;
  zoom: TimelineChartZoomOption;
}): ChartData {
  const line = aggregationData.history.map((forecast) => ({
    x: forecast.start_time,
    y: forecast.centers![0],
  }));
  const area = aggregationData.history.map((forecast) => ({
    x: forecast.start_time,
    y0: forecast.interval_lower_bounds![0],
    y: forecast.interval_upper_bounds![0],
  }));

  // const latestTimestamp = actualCloseTime
  //   ? Math.min(actualCloseTime / 1000, Date.now() / 1000)
  //   : Date.now() / 1000;
  // if (aggregationData.latest) {
  //   line.push({
  //     x: latestTimestamp,
  //     y: aggregationData.latest.centers![0],
  //   });
  //   area.push({
  //     x: latestTimestamp,
  //     y0: aggregationData.latest.interval_lower_bounds![0],
  //     y: aggregationData.latest.interval_upper_bounds![0],
  //   });
  // }

  let points: Line = [];

  const domainTimestamps = [
    ...aggregationData.history.map((f) => f.start_time),
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
