"use client";
import { format } from "date-fns";
import { FC, useMemo } from "react";
import {
  DomainTuple,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
} from "victory";

import { NumericChartDataset } from "@/types/charts";

type Props = {
  dataset: NumericChartDataset;
};

const NumericChart: FC<Props> = ({ dataset }) => {
  const { line, area, yDomain } = useMemo(
    () => buildChartData(dataset),
    [dataset]
  );

  return (
    <VictoryChart domain={{ y: yDomain }} height={150}>
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
          ticks: { stroke: "black", size: 5 },
          tickLabels: { fontSize: 10, padding: 2 },
        }}
      />
      <VictoryAxis
        tickFormat={(x: number, index: number) =>
          index % 10 === 0 ? format(new Date(x), "MMM d") : ""
        }
        tickCount={dataset.timestamps.length}
        style={{
          ticks: {
            fontSize: 10,
            stroke: "black",
            size: (({ text }: { text: string }) =>
              text === "" ? 3 : 5) as any,
          },
          tickLabels: { fontSize: 10, padding: 0 },
        }}
      />
    </VictoryChart>
  );
};

type ChartData = {
  line: Array<{ x: number; y: number }>;
  area: Array<{ x: number; y0: number; y: number }>;
  yDomain: DomainTuple;
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

  return { line, area, yDomain: [minYValue, maxYValue] };
}

export default NumericChart;
