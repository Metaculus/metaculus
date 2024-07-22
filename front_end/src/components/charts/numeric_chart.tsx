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
  NumericChartType,
  Scale,
  TimelineChartZoomOption,
} from "@/types/charts";
import { NumericForecast } from "@/types/question";
import {
  generateDateYScale,
  generateNumericDomain,
  generateNumericYScale,
  generatePercentageYScale,
  generateTimestampXScale,
  zoomTimestamps,
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
  type?: NumericChartType;
  extraTheme?: VictoryThemeDefinition;
};

const NumericChart: FC<Props> = ({
  dataset,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker = false,
  yLabel,
  height = 150,
  onCursorChange,
  onChartReady,
  type = "numeric",
  extraTheme,
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
    () => buildChartData({ dataset, width: chartWidth, height, type, zoom }),
    [dataset, chartWidth, height, type, zoom]
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
  type,
  height,
  dataset,
  width,
  zoom,
}: {
  dataset: NumericForecast;
  width: number;
  height: number;
  type: NumericChartType;
  zoom: TimelineChartZoomOption;
}): ChartData {
  const { timestamps, values_mean, values_min, values_max, my_forecasts } =
    dataset;

  const line = timestamps.map((timestamp, index) => ({
    x: timestamp,
    y: values_mean[index],
  }));
  const area = timestamps.map((timestamp, index) => ({
    x: timestamp,
    y0: values_min[index],
    y: values_max[index],
  }));

  let points: Line = [];
  if (my_forecasts !== null) {
    points = my_forecasts.timestamps.map((timestamp, index) => ({
      x: timestamp,
      y: my_forecasts.values_mean[index],
    }));
  }

  const xDomain = generateNumericDomain(zoomTimestamps(timestamps, zoom));
  const xScale = generateTimestampXScale(xDomain, width);

  let yDomain: Tuple<number>;
  let yScale: Scale;
  switch (type) {
    case "binary": {
      yDomain = [0, 1];
      yScale = generatePercentageYScale(height);
      break;
    }
    case "date": {
      const minYValue = Math.min(...dataset.values_min);
      const maxYValue = Math.max(...dataset.values_max);
      yDomain = [minYValue, maxYValue];
      yScale = generateDateYScale(yDomain);
      break;
    }
    default:
      const minYValue = Math.floor(Math.min(...dataset.values_min) * 0.95); // 5% padding
      const maxYValue = Math.ceil(Math.max(...dataset.values_max) * 1.05); // 5% padding
      yDomain = [minYValue, maxYValue];
      yScale = generateNumericYScale(yDomain);
  }

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

export default React.memo(NumericChart);
