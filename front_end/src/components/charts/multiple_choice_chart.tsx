"use client";
import React, { FC, useMemo } from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryGroup,
  VictoryLabel,
  VictoryLine,
} from "victory";

import { METAC_COLORS } from "@/contants/colors";
import useContainerSize from "@/hooks/use_container_size";
import { BaseChartData, Line, MultipleChoiceDataset } from "@/types/charts";
import {
  generateNumericDomain,
  generatePercentageYScale,
  generateTimestampXScale,
} from "@/utils/charts";

const CHART_PADDING = 10;
const COLOR_SCALE = Object.values(METAC_COLORS["mc-option"]).map(
  (value) => value.DEFAULT
);

type Props = {
  dataset: MultipleChoiceDataset;
  height?: number;
  yLabel?: string;
};

const MultipleChoiceChart: FC<Props> = ({ dataset, height = 150, yLabel }) => {
  const {
    ref: chartContainerRef,
    width: chartWidth,
    height: chartHeight,
  } = useContainerSize<HTMLDivElement>();
  const { xScale, yScale, lines } = useMemo(
    () => buildChartData(dataset, chartWidth, chartHeight),
    [dataset, chartWidth, chartHeight]
  );

  return (
    <div ref={chartContainerRef} className="w-full h-full">
      <VictoryChart
        width={chartWidth}
        height={height}
        padding={{
          top: CHART_PADDING,
          right: CHART_PADDING,
          bottom: CHART_PADDING + 10,
          left: CHART_PADDING + 40,
        }}
      >
        <VictoryGroup colorScale={COLOR_SCALE}>
          {lines.map((line, index) => (
            <VictoryLine
              key={`multiple-choice-line-${index}`}
              data={line}
              style={{
                data: {
                  strokeWidth: 1,
                },
              }}
            />
          ))}
        </VictoryGroup>
        <VictoryAxis
          dependentAxis
          tickValues={yScale.ticks}
          tickFormat={yScale.tickFormat}
          style={{
            ticks: {
              stroke: "black",
              size: (({ text }: { text: string }) =>
                text === "" ? 3 : 5) as any,
            },
            tickLabels: { fontSize: 10, padding: 2 },
            axisLabel: { fontSize: 10 },
          }}
          label={yLabel}
          axisLabelComponent={<VictoryLabel dy={-10} />}
        />
        <VictoryAxis
          tickValues={xScale.ticks}
          tickFormat={xScale.tickFormat}
          style={{
            ticks: {
              stroke: "black",
              size: (({ text }: { text: string }) =>
                text === "" ? 3 : 5) as any,
            },
            tickLabels: { fontSize: 10, padding: 0 },
          }}
        />
      </VictoryChart>
    </div>
  );
};

type ChartData = BaseChartData & {
  lines: Line[];
};

function buildChartData(
  dataset: MultipleChoiceDataset,
  width: number,
  height: number
): ChartData {
  const { timestamps, nr_forecasters, ...choices } = dataset;

  const lines: Line[] = [];
  for (const choiceValues of Object.values(choices)) {
    lines.push(
      timestamps.map((timestamp, timestampIndex) => ({
        x: timestamp,
        y: choiceValues[timestampIndex],
      }))
    );
  }

  const xDomain = generateNumericDomain(timestamps);

  return {
    xScale: generateTimestampXScale(xDomain, width),
    yScale: generatePercentageYScale(height),
    lines,
  };
}

export default MultipleChoiceChart;
