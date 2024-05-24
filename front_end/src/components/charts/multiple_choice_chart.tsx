"use client";
import { FC, useMemo } from "react";
import { VictoryAxis, VictoryChart } from "victory";

import useContainerSize from "@/hooks/use_container_size";
import { BaseChartData, MultipleChoiceDataset } from "@/types/charts";
import {
  generateNumericDomain,
  generatePercentageYScale,
  generateTimestampXScale,
} from "@/utils/charts";

const CHART_PADDING = 10;

type Props = {
  dataset: MultipleChoiceDataset;
  height?: number;
};

const MultipleChoiceChart: FC<Props> = ({ dataset, height = 150 }) => {
  const {
    ref: chartContainerRef,
    width: chartWidth,
    height: chartHeight,
  } = useContainerSize<HTMLDivElement>();
  const { xScale, yScale } = useMemo(
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

type ChartData = BaseChartData;

function buildChartData(
  dataset: MultipleChoiceDataset,
  width: number,
  height: number
): ChartData {
  const { timestamps } = dataset;

  const xDomain = generateNumericDomain(timestamps);

  return {
    xScale: generateTimestampXScale(xDomain, width),
    yScale: generatePercentageYScale(height),
  };
}

export default MultipleChoiceChart;
