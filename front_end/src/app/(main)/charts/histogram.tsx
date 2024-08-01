"use client";

import { range } from "lodash";
import { useTranslations } from "next-intl";
import React from "react";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryLine,
  VictoryLabel,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import useAppTheme from "@/hooks/use_app_theme";

type HistogramProps = {
  histogramData: { x: number; y: number }[];
  median: number | undefined;
  mean: number | undefined;
  color: string;
};

const Histogram: React.FC<HistogramProps> = ({
  histogramData,
  median,
  mean,
  color,
}) => {
  const t = useTranslations();
  const { theme } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const maxY = Math.max(...histogramData.map((d) => d.y));

  return (
    <div className="mb-5 size-full">
      <div className="mb-2 text-center">
        {median !== undefined && (
          <span className="text-sm font-bold">
            <span style={{ color }}>{`${(100 * median).toFixed(1)}%`}</span>{" "}
            {t("medianPredictionLabel")}
          </span>
        )}
        {mean !== undefined && (
          <span className="ml-8 text-sm font-bold">
            {" "}
            <span style={{ color }}>{`${(100 * mean).toFixed(1)}%`}</span>{" "}
            {t("meanPredictionLabel")}
          </span>
        )}
      </div>
      <VictoryChart
        theme={chartTheme}
        domain={{
          x: [0, 100],
          y: [0, maxY],
        }}
        containerComponent={<VictoryContainer responsive={true} />}
        padding={{ top: 0, bottom: 15, left: 10, right: 10 }}
        height={48}
      >
        <VictoryAxis
          tickValues={range(0, 101)}
          tickFormat={(x: number) => (x % 10 === 0 ? `${x}%` : "")}
          style={{
            tickLabels: {
              fontSize: 5,
            },
            axis: { stroke: chartTheme.axis?.style?.axis?.stroke },
            grid: { stroke: "none" },
          }}
        />
        <VictoryBar
          data={histogramData}
          style={{
            data: {
              fill: "light" + color,
              stroke: "dark" + color,
              strokeWidth: 1,
            },
          }}
          barRatio={1.1}
          x={(d) => d.x + 0.5}
        />
      </VictoryChart>
    </div>
  );
};

export default Histogram;
