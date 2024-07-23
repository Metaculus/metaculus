"use client";

import { merge } from "lodash";
import React from "react";
import {
  VictoryChart,
  VictoryAxis,
  VictoryBar,
  VictoryLabel,
  VictoryScatter,
  VictoryContainer,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import useAppTheme from "@/hooks/use_app_theme";

const CalibrationChart: React.FC<{ data: any; showIntervals?: boolean }> = ({
  data,
  showIntervals = true,
}) => {
  const calibrationData = data;

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = merge({}, chartTheme);
  console.log(actualTheme.axis?.style?.axis?.stroke);

  return (
    <div className="mb-5 size-full">
      <VictoryChart
        theme={actualTheme}
        domain={{ x: [0, 1], y: [0, 1] }}
        containerComponent={<VictoryContainer responsive={true} />}
        padding={{ top: 24, bottom: 24, left: 35, right: 12 }}
      >
        <VictoryAxis
          tickValues={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          tickFormat={(t: number) => `${(t * 100).toFixed(0)}%`}
          style={{
            tickLabels: { fontSize: 10, fontWeight: "lighter", opacity: 0.6 },
            axis: { stroke: actualTheme.axis?.style?.axis?.stroke },
            grid: { stroke: actualTheme.axis?.style?.axis?.stroke },
          }}
        />
        <VictoryAxis
          tickValues={[0, 0.2, 0.4, 0.6, 0.8, 1]}
          tickFormat={(t: number) => `${(t * 100).toFixed(0)}%`}
          dependentAxis
          axisLabelComponent={<VictoryLabel dy={-12} />}
          style={{
            tickLabels: { fontSize: 10, fontWeight: "lighter", opacity: 0.6 },
            axis: { stroke: actualTheme.axis?.style?.axis?.stroke },
            grid: { stroke: actualTheme.axis?.style?.axis?.stroke },
          }}
        />
        <VictoryScatter
          data={calibrationData.map((d: any, index: number) => {
            const y = d.user_middle_quartile;
            return {
              x: (index + 0.5) / calibrationData.length,
              y0: y - 0.01,
              y: y,
              symbol: "diamond",
            };
          })}
          style={{
            data: {
              fill: "orange",
              stroke: "none",
            },
          }}
        />
        <VictoryBar
          barRatio={1.1}
          data={calibrationData.map((d: any, index: number) => {
            const y = d.perfect_calibration;
            return {
              x: (index + 0.5) / calibrationData.length,
              y0: y - 0.01,
              y: y,
            };
          })}
          style={{ data: { fill: "darkgray", opacity: 1 } }}
        />
        {/* Confidence interval area */}
        {showIntervals && (
          <VictoryBar
            barRatio={1.1}
            data={calibrationData.map((d: any, index: number) => {
              return {
                x: (index + 0.5) / calibrationData.length,
                y0: d.user_lower_quartile,
                y: d.user_upper_quartile,
              };
            })}
            style={{ data: { fill: "lightgray", opacity: 0.5 } }}
          />
        )}
      </VictoryChart>
    </div>
  );
};

export default CalibrationChart;
