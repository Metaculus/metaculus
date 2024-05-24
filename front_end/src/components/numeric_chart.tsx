"use client";
import * as d3 from "d3";
import React, { FC, useEffect, useMemo, useRef, useState } from "react";
import {
  CursorCoordinatesPropType,
  DomainTuple,
  LineSegment,
  Scale,
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryCursorContainer,
  VictoryLabel,
  VictoryLabelProps,
  VictoryLine,
} from "victory";

import ChartCursorLabel from "@/components/chart_cursor_label";
import usePrevious from "@/hooks/use_previous";
import { NumericChartDataset } from "@/types/charts";

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
  const { line, area, yDomain, xScale, yScale } = useMemo(
    () => buildChartData(dataset),
    [dataset]
  );
  const defaultCursor = dataset.timestamps[dataset.timestamps.length - 1];

  const [isCursorActive, setIsCursorActive] = useState(false);

  const chartContainerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number>();

  const prevWidth = usePrevious(width);
  useEffect(() => {
    if (!prevWidth && width && onChartReady) {
      onChartReady();
    }
  }, [onChartReady, prevWidth, width]);

  useEffect(() => {
    const resizeObserver = new ResizeObserver((entries) => {
      const width = entries[0].contentRect.width;
      setWidth(width);
    });

    let container: HTMLDivElement;
    if (chartContainerRef.current) {
      resizeObserver.observe(chartContainerRef.current);
      container = chartContainerRef.current;
    }

    return () => {
      if (container) {
        resizeObserver.unobserve(container);
      }
    };
  }, []);

  return (
    <div ref={chartContainerRef} className="w-full h-full">
      {!!width && (
        <VictoryChart
          domain={{ y: yDomain }}
          width={width}
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

type TickFormat = (value: number, index?: number, ticks?: number[]) => string;
type Scale = {
  ticks: number[];
  tickFormat: TickFormat;
};
type ChartData = {
  line: Array<{ x: number; y: number }>;
  area: Array<{ x: number; y0: number; y: number }>;
  yDomain: DomainTuple;
  xScale: Scale;
  yScale: Scale;
};

function buildChartData(dataset: NumericChartDataset): ChartData {
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

  const minXValue = Math.min(...dataset.timestamps);
  const maxXValue = Math.max(...dataset.timestamps);

  return {
    line,
    area,
    yDomain: [minYValue, maxYValue],
    xScale: generateXScale([minXValue, maxXValue]),
    yScale: generateYScale([minYValue, maxYValue]),
  };
}

function generateXScale(xDomain: Tuple<number>): Scale {
  const threeMonths = 3 * 30 * 24 * 60 * 60 * 1000;
  const twoYears = 2 * 365 * 24 * 60 * 60 * 1000;

  let ticks;
  let format;
  const timeRange = xDomain[1] - xDomain[0];
  if (timeRange < threeMonths) {
    ticks = d3.timeDay.range(new Date(xDomain[0]), new Date(xDomain[1]));
    format = d3.timeFormat("%b %d");
  } else if (timeRange < twoYears) {
    ticks = d3.timeMonth.range(new Date(xDomain[0]), new Date(xDomain[1]));
    format = d3.timeFormat("%b %Y");
  } else {
    ticks = d3.timeYear.range(new Date(xDomain[0]), new Date(xDomain[1]));
    format = d3.timeFormat("%Y");
  }

  return {
    ticks: ticks.map((tick) => tick.getTime()),
    tickFormat: (x: number, index?: number, ticks?: number[]) => {
      if (!index) {
        return format(new Date(x));
      }

      if (index % 3 !== 0) {
        return "";
      }

      if (ticks && index >= ticks.length - 2) {
        return "";
      }

      return format(new Date(x));
    },
  };
}

function generateYScale(yDomain: [number, number]): Scale {
  const [min, max] = yDomain;
  const range = max - min;

  const majorStep = range / 4;
  const minorStep = majorStep / 5;

  const majorTicks = new Set<number>();
  for (let i = min; i <= max; i += majorStep) {
    majorTicks.add(Math.round(i));
  }

  const minorTicks = new Set<number>();
  for (let i = min; i <= max; i += minorStep) {
    if (!majorTicks.has(Math.round(i))) {
      minorTicks.add(Math.round(i));
    }
  }

  const ticks = [...Array.from(majorTicks), ...Array.from(minorTicks)].sort(
    (a, b) => a - b
  );

  return { ticks, tickFormat: (y) => (majorTicks.has(y) ? y.toString() : "") };
}

export default React.memo(NumericChart);
