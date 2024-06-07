"use client";
import React, { FC } from "react";
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLine } from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { binWeightsFromSliders } from "@/utils/math";

type Props = {
  min: number;
  max: number;
  left: number;
  center: number;
  right: number;
};

const NumericPickerChart: FC<Props> = ({ min, max, left, center, right }) => {
  const dataset = binWeightsFromSliders(left, center, right);
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

  return (
    <div ref={chartContainerRef} className="h-full w-full">
      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          height={500}
          theme={chartTheme}
          domain={{
            x: [min, max],
            y: [0, 2 * Math.min(0.01, Math.max(...dataset))],
          }}
        >
          <VictoryArea
            data={chartData}
            style={{
              data: {
                fill: METAC_COLORS.olive["500"].DEFAULT,
                opacity: 0.3,
              },
            }}
          />
          <VictoryLine
            data={chartData}
            style={{
              data: {
                stroke: METAC_COLORS.olive["700"].DEFAULT,
              },
            }}
          />
          <VictoryAxis tickValues={xTickValues} />
        </VictoryChart>
      )}
    </div>
  );
};
export default React.memo(NumericPickerChart);
