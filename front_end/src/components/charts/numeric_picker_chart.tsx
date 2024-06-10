"use client";
import React, { FC } from "react";
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLine } from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";

type Props = {
  dataset: number[];
  min: number;
  max: number;
  lower25: number;
  median: number;
  upper75: number;
};

const NumericPickerChart: FC<Props> = ({
  min,
  max,
  dataset,
  lower25,
  median,
  upper75,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const chartData: { x: number; y: number }[] = [];
  dataset.forEach((value, index) => {
    if (index === 0 || index === dataset.length - 1) {
      // first and last bins are probabilty mass out of bounds
      return;
    }
    chartData.push({ x: (index * (max - min)) / dataset.length, y: value });
  });
  // TODO: find a nice way to display the out of bounds weights as numbers
  const massBelowBounds = dataset[0];
  const massAboveBounds = dataset[dataset.length - 1];

  const xTickValues = [
    min,
    ...Array.from({ length: 7 }, (_, i) => min + ((i + 1) * (max - min)) / 8),
    max,
  ]
    .map((x) => Number(x.toFixed(0)))
    .slice(1, -1);

  const verticalLines = [
    {
      x: lower25 * 10,
      y: chartData[Math.min(198, Math.round(lower25 * 200))].y,
    },
    { x: median * 10, y: chartData[Math.min(198, Math.round(median * 200))].y },
    {
      x: upper75 * 10,
      y: chartData[Math.min(198, Math.round(upper75 * 200))].y,
    },
  ];

  console.log(verticalLines);

  return (
    <div ref={chartContainerRef} className="h-full w-full">
      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          theme={chartTheme}
          domain={{
            x: [min, max],
            y: [0, 1.2 * Math.max(...dataset)],
          }}
        >
          <VictoryArea
            data={chartData}
            style={{
              data: {
                fill: METAC_COLORS.orange["300"].DEFAULT,
                opacity: 0.3,
              },
            }}
          />
          <VictoryLine
            data={chartData}
            style={{
              data: {
                stroke: METAC_COLORS.orange["500"].DEFAULT,
                strokeDasharray: "2,2",
              },
            }}
          />
          {verticalLines.map((line, index) => (
            <VictoryLine
              key={index}
              data={[
                { x: line.x, y: 0 },
                { x: line.x, y: line.y },
              ]}
              style={{
                data: {
                  stroke: METAC_COLORS.orange["500"].DEFAULT,
                  strokeDasharray: "2,2",
                },
              }}
            />
          ))}
          <VictoryAxis tickValues={xTickValues} />
        </VictoryChart>
      )}
    </div>
  );
};
export default React.memo(NumericPickerChart);
