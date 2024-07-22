"use client";
import { merge } from "lodash";
import React, { FC, memo, useEffect, useMemo, useState } from "react";
import {
  CursorCoordinatesPropType,
  DomainTuple,
  LineSegment,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryCursorContainer,
  VictoryLabel,
  VictoryLabelProps,
  VictoryLine,
  VictoryThemeDefinition,
} from "victory";

import { lightTheme, darkTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import {
  Area,
  BaseChartData,
  Line,
  TickFormat,
  TimelineChartZoomOption,
} from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { ThemeColor } from "@/types/theme";
import {
  findClosestTimestamp,
  generateNumericDomain,
  generatePercentageYScale,
  generateTimestampXScale,
  zoomTimestamps,
} from "@/utils/charts";

import ChartContainer from "./primitives/chart_container";
import ChartCursorLabel from "./primitives/chart_cursor_label";
import XTickLabel from "./primitives/x_tick_label";

type Props = {
  timestamps: number[];
  choiceItems: ChoiceItem[];
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  height?: number;
  yLabel?: string;
  onCursorChange?: (value: number, format: TickFormat) => void;
  onChartReady?: () => void;
  extraTheme?: VictoryThemeDefinition;
};

const MultipleChoiceChart: FC<Props> = ({
  timestamps,
  choiceItems,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker = false,
  height = 150,
  yLabel,
  onCursorChange,
  onChartReady,
  extraTheme,
}) => {
  const {
    ref: chartContainerRef,
    width: chartWidth,
    height: chartHeight,
  } = useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const defaultCursor = timestamps[timestamps.length - 1];
  const [isCursorActive, setIsCursorActive] = useState(false);

  const [zoom, setZoom] = useState<TimelineChartZoomOption>(defaultZoom);
  const { xScale, yScale, graphs, xDomain } = useMemo(
    () =>
      buildChartData({
        timestamps,
        choiceItems,
        width: chartWidth,
        height: chartHeight,
        zoom,
      }),
    [timestamps, choiceItems, chartWidth, chartHeight, zoom]
  );

  const isHighlightActive = useMemo(
    () => Object.values(choiceItems).some(({ highlighted }) => highlighted),
    [choiceItems]
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
          const closestTimestamp = findClosestTimestamp(timestamps, value);

          onCursorChange(closestTimestamp, xScale.tickFormat);
        }
      }}
    />
  );

  return (
    <ChartContainer
      ref={chartContainerRef}
      height={height}
      zoom={withZoomPicker ? zoom : undefined}
      onZoomChange={setZoom}
    >
      {!!chartWidth && (
        <VictoryChart
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
          domain={{ x: xDomain }}
        >
          {graphs.map(({ line, color, active, highlighted }, index) => (
            <VictoryLine
              key={`multiple-choice-line-${index}`}
              data={line}
              style={{
                data: {
                  stroke: active ? getThemeColor(color) : "transparent",
                  strokeOpacity: !isHighlightActive ? 1 : highlighted ? 1 : 0.2,
                },
              }}
            />
          ))}
          {graphs.map(({ area, color, highlighted }, index) =>
            !!area && highlighted ? (
              <VictoryArea
                key={`multiple-choice-area-${index}`}
                data={area}
                style={{
                  data: {
                    fill: getThemeColor(color),
                    opacity: 0.3,
                  },
                }}
              />
            ) : null
          )}
          <VictoryAxis
            dependentAxis
            tickValues={yScale.ticks}
            tickFormat={yScale.tickFormat}
            style={{
              tickLabels: { padding: 2 },
            }}
            label={yLabel}
            axisLabelComponent={
              <VictoryLabel dy={-10} style={{ fill: "white" }} />
            }
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

export type ChoiceGraph = {
  line: Line;
  area?: Area;
  choice: string;
  color: ThemeColor;
  active: boolean;
  highlighted: boolean;
};
type ChartData = BaseChartData & {
  graphs: ChoiceGraph[];
  xDomain: DomainTuple;
};

function buildChartData({
  height,
  width,
  choiceItems,
  timestamps,
  zoom,
}: {
  timestamps: number[];
  choiceItems: ChoiceItem[];
  width: number;
  height: number;
  zoom: TimelineChartZoomOption;
}): ChartData {
  const xDomain = generateNumericDomain(zoomTimestamps(timestamps, zoom));

  const graphs: ChoiceGraph[] = choiceItems.map(
    ({
      choice,
      values,
      minValues,
      maxValues,
      color,
      active,
      highlighted,
      timestamps: choiceTimestamps,
    }) => {
      const actualTimestamps = choiceTimestamps ?? timestamps;

      const item: ChoiceGraph = {
        choice,
        color,
        line: actualTimestamps.map((timestamp, timestampIndex) => ({
          x: timestamp,
          y: values[timestampIndex] ?? 0,
        })),
        active,
        highlighted,
      };

      if (minValues && maxValues) {
        item.area = actualTimestamps.map((timestamp, timestampIndex) => ({
          x: timestamp,
          y: maxValues[timestampIndex] ?? 0,
          y0: minValues[timestampIndex] ?? 0,
        }));
      }

      return item;
    }
  );

  return {
    xScale: generateTimestampXScale(xDomain, width),
    yScale: generatePercentageYScale(height),
    graphs: graphs,
    xDomain,
  };
}

export default memo(MultipleChoiceChart);
