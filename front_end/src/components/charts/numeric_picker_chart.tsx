"use client";
import React, { FC } from "react";
import { VictoryArea, VictoryAxis, VictoryChart, VictoryLine } from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { computeQuartilesFromCDF } from "@/utils/math";

type Props = {
  min: number;
  max: number;
  data: {
    pmf: number[];
    cdf: number[];
    color: string;
  }[];
};

const NumericPickerChart: FC<Props> = ({ min, max, data }) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const chartDataArr: { x: number; y: number }[][] = [];
  data.forEach((x) => {
    const chartData: { x: number; y: number }[] = [];
    const pmf = x.pmf;
    pmf.forEach((value, index) => {
      if (index === 0 || index === pmf.length - 1) {
        // first and last bins are probabilty mass out of bounds
        return;
      }
      chartData.push({ x: (index * (max - min)) / pmf.length, y: value });
    });
    chartDataArr.push(chartData.slice(1, chartData.length - 1));
  });

  // TODO: find a nice way to display the out of bounds weights as numbers
  // const massBelowBounds = dataset[0];
  // const massAboveBounds = dataset[dataset.length - 1];

  // @TODO Luke can you fix the ticks
  const xTickValues = [
    min,
    ...Array.from({ length: 7 }, (_, i) => min + ((i + 1) * (max - min)) / 8),
    max,
  ].map((x) => Number(x.toFixed(0)));
  //.slice(1, -1);

  const verticalLinesArr: { x: number; y: number }[][] = [];
  data.forEach((x, i) => {
    const quantiles = computeQuartilesFromCDF(x.cdf);
    verticalLinesArr.push([
      {
        x: quantiles.lower25 * 10,
        y: chartDataArr[i][Math.min(198, Math.round(quantiles.lower25 * 200))]
          .y,
      },
      {
        x: quantiles.median * 10,
        y: chartDataArr[i][Math.min(198, Math.round(quantiles.median * 200))].y,
      },
      {
        x: quantiles.upper75 * 10,
        y: chartDataArr[i][Math.min(198, Math.round(quantiles.upper75 * 200))]
          .y,
      },
    ]);
  });

  return (
    <div ref={chartContainerRef} className="h-full w-full">
      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          theme={chartTheme}
          domain={{
            x: [min, max],
            y: [0, 1.2 * Math.max(...data.map((x) => x.pmf).flat())],
          }}
        >
          {chartDataArr.map((chartData, index) => (
            <VictoryArea
              key={`area-${index}`}
              data={chartData}
              style={{
                data: {
                  fill:
                    data[index].color === "orange"
                      ? METAC_COLORS.orange["300"].DEFAULT
                      : METAC_COLORS.green["200"].DEFAULT,
                  opacity: 0.3,
                },
              }}
            />
          ))}
          {chartDataArr.map((chartData, index) => (
            <VictoryLine
              key={`line-${index}`}
              data={chartData}
              style={{
                data: {
                  stroke:
                    data[index].color === "orange"
                      ? METAC_COLORS.orange["500"].DEFAULT
                      : METAC_COLORS.green["500"].DEFAULT,
                  strokeDasharray: "2,2",
                },
              }}
            />
          ))}
          <VictoryAxis tickValues={xTickValues} />
          {verticalLinesArr.map((verticalLines, k) => {
            return verticalLines.map((line, index) => {
              return (
                <VictoryLine
                  key={`${k}-${index}`}
                  data={[
                    { x: line.x, y: 0 },
                    { x: line.x, y: line.y },
                  ]}
                  style={{
                    data: {
                      stroke:
                        data[k].color === "orange"
                          ? METAC_COLORS.orange["500"].DEFAULT
                          : METAC_COLORS.green["500"].DEFAULT,
                      strokeDasharray: "2,2",
                    },
                  }}
                />
              );
            });
          })}
        </VictoryChart>
      )}
    </div>
  );
};
export default React.memo(NumericPickerChart);
