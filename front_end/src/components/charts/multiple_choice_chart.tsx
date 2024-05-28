"use client";
import React, { FC, memo, useEffect, useMemo, useState } from "react";
import {
  CursorCoordinatesPropType,
  LineSegment,
  VictoryAxis,
  VictoryChart,
  VictoryCursorContainer,
  VictoryLabel,
  VictoryLabelProps,
  VictoryLine,
} from "victory";

import ChartCursorLabel from "@/components/charts/primitives/chart_cursor_label";
import chartTheme from "@/contants/chart_theme";
import { METAC_COLORS } from "@/contants/colors";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import { BaseChartData, Line, TickFormat } from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import {
  generateNumericDomain,
  generatePercentageYScale,
  generateTimestampXScale,
} from "@/utils/charts";

type Props = {
  timestamps: number[];
  choiceItems: ChoiceItem[];
  height?: number;
  yLabel?: string;
  onCursorChange?: (value: number, format: TickFormat) => void;
  onChartReady?: () => void;
};

const MultipleChoiceChart: FC<Props> = ({
  timestamps,
  choiceItems,
  height = 150,
  yLabel,
  onCursorChange,
  onChartReady,
}) => {
  const {
    ref: chartContainerRef,
    width: chartWidth,
    height: chartHeight,
  } = useContainerSize<HTMLDivElement>();

  const defaultCursor = timestamps[timestamps.length - 1];
  const [isCursorActive, setIsCursorActive] = useState(false);

  const { xScale, yScale, lines } = useMemo(
    () => buildChartData(timestamps, choiceItems, chartWidth, chartHeight),
    [timestamps, choiceItems, chartWidth, chartHeight]
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

  return (
    <div ref={chartContainerRef} className="w-full h-full">
      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={chartTheme}
          events={[
            {
              target: "parent",
              eventHandlers: {
                onMouseOverCapture: () => {
                  setIsCursorActive(true);
                },
                onMouseOutCapture: () => {
                  setIsCursorActive(false);
                },
              },
            },
          ]}
          containerComponent={
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
                    : `${xScale.tickFormat(datum.x)}`;
                }
              }}
              cursorComponent={
                <LineSegment
                  style={{
                    stroke: METAC_COLORS.gray["600"].DEFAULT,
                    strokeDasharray: "2,1",
                  }}
                />
              }
              cursorLabelComponent={
                <ChartCursorLabel positionY={height - 10} />
              }
              onCursorChange={(value: CursorCoordinatesPropType) => {
                if (typeof value === "number" && onCursorChange) {
                  const closestTimestamp = timestamps.reduce((prev, curr) =>
                    Math.abs(curr - value) < Math.abs(prev - value)
                      ? curr
                      : prev
                  );

                  onCursorChange(closestTimestamp, xScale.tickFormat);
                }
              }}
            />
          }
        >
          {lines.map(({ line, color, active, highlighted }, index) => {
            return (
              <VictoryLine
                key={`multiple-choice-line-${index}`}
                data={line}
                style={{
                  data: {
                    stroke: active ? color : "transparent",
                    strokeOpacity: !isHighlightActive
                      ? 1
                      : highlighted
                        ? 1
                        : 0.2,
                  },
                }}
              />
            );
          })}
          <VictoryAxis
            dependentAxis
            tickValues={yScale.ticks}
            tickFormat={yScale.tickFormat}
            style={{ tickLabels: { padding: 2 } }}
            label={yLabel}
            axisLabelComponent={<VictoryLabel dy={-10} />}
          />
          <VictoryAxis
            tickValues={xScale.ticks}
            tickFormat={isCursorActive ? () => "" : xScale.tickFormat}
          />
        </VictoryChart>
      )}
    </div>
  );
};

export type ChoiceLine = {
  line: Line;
  choice: string;
  color: string;
  active: boolean;
  highlighted: boolean;
};
type ChartData = BaseChartData & {
  lines: ChoiceLine[];
};

function buildChartData(
  timestamps: number[],
  choiceItems: ChoiceItem[],
  width: number,
  height: number
): ChartData {
  const lines: ChoiceLine[] = choiceItems.map(
    ({ choice, values, color, active, highlighted }) => ({
      choice,
      color,
      line: timestamps.map((timestamp, timestampIndex) => ({
        x: timestamp,
        y: values[timestampIndex],
      })),
      active,
      highlighted,
    })
  );

  const xDomain = generateNumericDomain(timestamps);

  return {
    xScale: generateTimestampXScale(xDomain, width),
    yScale: generatePercentageYScale(height),
    lines,
  };
}

export default memo(MultipleChoiceChart);
