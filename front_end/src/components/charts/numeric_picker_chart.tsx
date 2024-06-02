"use client";
import React, { FC } from "react";
import { VictoryArea, VictoryChart, VictoryLine, VictoryAxis } from "victory";

import { darkTheme, lightTheme } from "@/contants/chart_theme";
import { METAC_COLORS } from "@/contants/colors";
import useContainerSize from "@/hooks/use_container_size";
import useThemeDetector from "@/hooks/use_is_dark_mode";
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

  const isDarkTheme = useThemeDetector();
  const chartTheme = isDarkTheme ? darkTheme : lightTheme;

  const chartData = dataset.map((value, index) => ({
    x: (index * (max - min)) / dataset.length,
    y: value,
  }));

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
          height={200}
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
