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

import ChartCursorLabel from "@/components/charts/primitives/chart_cursor_label";
import { darkTheme, lightTheme } from "@/contants/chart_theme";
import { METAC_COLORS } from "@/contants/colors";
import useContainerSize from "@/hooks/use_container_size";
import useThemeDetector from "@/hooks/use_is_dark_mode";
import usePrevious from "@/hooks/use_previous";
import { Area, BaseChartData, Line } from "@/types/charts";
import { NumericForecast } from "@/types/question";
import {
  generateNumericDomain,
  generateNumericYScale,
  generatePercentageYScale,
  generateTimestampXScale,
} from "@/utils/charts";

type Props = {
  dataset: NumericForecast;
  yLabel?: string;
  height?: number;
  onCursorChange?: (value: number) => void;
  onChartReady?: () => void;
  binary: boolean;
};

const NumericChart: FC<Props> = ({
  dataset,
  yLabel,
  height = 150,
  onCursorChange,
  onChartReady,
  binary,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const isDarkTheme = useThemeDetector();
  const chartTheme = isDarkTheme ? darkTheme : lightTheme;

  const defaultCursor = dataset.timestamps[dataset.timestamps.length - 1];
  const [isCursorActive, setIsCursorActive] = useState(false);

  const { line, area, yDomain, xScale, yScale } = useMemo(
    () => buildChartData(dataset, chartWidth, height, binary),
    [dataset, chartWidth, height, binary]
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

  return (
    <div ref={chartContainerRef} className="h-full w-full">
      {!!chartWidth && (
        <VictoryChart
          domain={{ y: yDomain }}
          width={chartWidth}
          height={height}
          theme={chartTheme}
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
                fill: METAC_COLORS.olive["500"].DEFAULT,
                opacity: 0.3,
              },
            }}
          />
          <VictoryLine
            data={line}
            style={{
              data: {
                stroke: METAC_COLORS.olive["700"].DEFAULT,
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

type ChartData = BaseChartData & {
  line: Line;
  area: Area;
  yDomain: DomainTuple;
};

function buildChartData(
  dataset: NumericForecast,
  width: number,
  height: number,
  binary: boolean
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
    yScale: binary
      ? generatePercentageYScale(height)
      : generateNumericYScale([minYValue, maxYValue]),
  };
}

export default React.memo(NumericChart);
