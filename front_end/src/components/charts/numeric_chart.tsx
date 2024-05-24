"use client";
import React, { FC, useEffect, useMemo, useState } from "react";
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
} from "victory";

import ChartCursorLabel from "@/components/chart_cursor_label";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import { BaseChartData, NumericChartDataset } from "@/types/charts";
import {
  generateNumericDomain,
  generateNumericYScale,
  generateTimestampXScale,
} from "@/utils/charts";

const CHART_PADDING = 10;

type Props = {
  dataset: NumericChartDataset;
  yLabel?: string;
  height?: number;
  onCursorChange?: (value: number) => void;
  onChartReady?: () => void;
};

const NumericChart: FC<Props> = ({
  dataset,
  yLabel,
  height = 150,
  onCursorChange,
  onChartReady,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const defaultCursor = dataset.timestamps[dataset.timestamps.length - 1];
  const [isCursorActive, setIsCursorActive] = useState(false);

  const { line, area, yDomain, xScale, yScale } = useMemo(
    () => buildChartData(dataset, chartWidth),
    [dataset, chartWidth]
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
          domain={{ y: yDomain }}
          width={chartWidth}
          height={height}
          padding={{
            top: CHART_PADDING,
            right: CHART_PADDING,
            bottom: CHART_PADDING + 10,
            left: CHART_PADDING + 40,
          }}
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
                    stroke: "rgb(119, 119, 119)",
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
          <VictoryArea
            data={area}
            style={{
              data: {
                fill: "#9fd19f",
                opacity: 0.3,
              },
            }}
          />
          <VictoryLine
            data={line}
            style={{
              data: {
                stroke: "#748c74",
                strokeWidth: 1,
              },
            }}
          />
          <VictoryAxis
            dependentAxis
            style={{
              ticks: {
                stroke: "black",
                size: (({ text }: { text: string }) =>
                  text === "" ? 3 : 5) as any,
              },
              tickLabels: { fontSize: 10, padding: 2 },
              axisLabel: { fontSize: 10 },
            }}
            tickValues={yScale.ticks}
            tickFormat={yScale.tickFormat}
            label={yLabel}
            axisLabelComponent={<VictoryLabel dy={-10} />}
          />
          <VictoryAxis
            style={{
              ticks: {
                stroke: "black",
                size: (({ text }: { text: string }) =>
                  text === "" ? 3 : 5) as any,
              },
              tickLabels: { fontSize: 10, padding: 0 },
            }}
            tickValues={xScale.ticks}
            tickFormat={isCursorActive ? () => "" : xScale.tickFormat}
          />
        </VictoryChart>
      )}
    </div>
  );
};

type ChartData = BaseChartData & {
  line: Array<{ x: number; y: number }>;
  area: Array<{ x: number; y0: number; y: number }>;
  yDomain: DomainTuple;
};

function buildChartData(
  dataset: NumericChartDataset,
  width: number
): ChartData {
  const line = dataset.timestamps.map((timestamp, index) => ({
    x: timestamp,
    y: dataset.values_mean[index],
  }));
  const area = dataset.timestamps.map((timestamp, index) => ({
    x: timestamp,
    y0: dataset.values_min[index],
    y: dataset.values_max[index],
  }));

  const minYValue = Math.floor(Math.min(...dataset.values_min) * 0.95); // 5% padding
  const maxYValue = Math.ceil(Math.max(...dataset.values_max) * 1.05); // 5% padding

  const xDomain = generateNumericDomain(dataset.timestamps);

  return {
    line,
    area,
    yDomain: [minYValue, maxYValue],
    xScale: generateTimestampXScale(xDomain, width),
    yScale: generateNumericYScale([minYValue, maxYValue]),
  };
}

export default React.memo(NumericChart);
