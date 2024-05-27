"use client";
import React, { FC, useEffect, useMemo, useState } from "react";
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

import ChartCursorLabel from "@/components/chart_cursor_label";
import chartTheme from "@/contants/chart_theme";
import { METAC_COLORS } from "@/contants/colors";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import { BaseChartData, Line, MultipleChoiceDataset } from "@/types/charts";
import {
  generateNumericDomain,
  generatePercentageYScale,
  generateTimestampXScale,
} from "@/utils/charts";

const COLOR_SCALE = Object.values(METAC_COLORS["mc-option"]).map(
  (value) => value.DEFAULT
);

type Props = {
  dataset: MultipleChoiceDataset;
  height?: number;
  yLabel?: string;
  onCursorChange?: (value: number) => void;
  onChartReady?: () => void;
};

const MultipleChoiceChart: FC<Props> = ({
  dataset,
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

  const defaultCursor = dataset.timestamps[dataset.timestamps.length - 1];
  const [isCursorActive, setIsCursorActive] = useState(false);

  const { xScale, yScale, lines } = useMemo(
    () => buildChartData(dataset, chartWidth, chartHeight),
    [dataset, chartWidth, chartHeight]
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
                  const closestTimestamp = dataset.timestamps.reduce(
                    (prev, curr) =>
                      Math.abs(curr - value) < Math.abs(prev - value)
                        ? curr
                        : prev
                  );

                  onCursorChange(closestTimestamp);
                }
              }}
            />
          }
        >
          {lines.map(({ line, color }, index) => (
            <VictoryLine
              key={`multiple-choice-line-${index}`}
              data={line}
              style={{
                data: { stroke: color },
              }}
            />
          ))}
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
      <div className="mt-3 flex flex-wrap items-center justify-center gap-3 text-xs font-normal">
        {lines.map(({ label, color }) => (
          <div key={`option-${label}`}>{label}</div>
        ))}
      </div>
    </div>
  );
};

type ChoiceLine = {
  line: Line;
  label: string;
  color: string;
};
type ChartData = BaseChartData & {
  lines: ChoiceLine[];
};

function buildChartData(
  dataset: MultipleChoiceDataset,
  width: number,
  height: number
): ChartData {
  const { timestamps, nr_forecasters, ...choices } = dataset;

  const lines: ChoiceLine[] = [];
  Object.entries(choices).forEach(([choiceLabel, choiceValues], index) => {
    lines.push({
      label: choiceLabel,
      line: timestamps.map((timestamp, timestampIndex) => ({
        x: timestamp,
        y: choiceValues[timestampIndex],
      })),
      color: COLOR_SCALE[index],
    });
  });

  const xDomain = generateNumericDomain(timestamps);

  return {
    xScale: generateTimestampXScale(xDomain, width),
    yScale: generatePercentageYScale(height),
    lines,
  };
}

export default MultipleChoiceChart;
