"use client";

import { range } from "lodash";
import { useTranslations } from "next-intl";
import React from "react";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import useAppTheme from "@/hooks/use_app_theme";
import cn from "@/utils/core/cn";

type HistogramProps = {
  histogramData: { x: number; y: number }[];
  median: number | undefined;
  mean: number | undefined;
  color: "blue" | "gray";
  width?: number;
};

const Histogram: React.FC<HistogramProps> = ({
  histogramData,
  median,
  mean,
  color,
  width,
}) => {
  const t = useTranslations();
  const { theme } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const maxY = Math.max(...histogramData.map((d) => d.y));

  return (
    <>
      <div className="mb-2 text-center">
        {median != null && (
          <span className="text-sm font-bold capitalize">
            {t("median")}{" "}
            <span
              className={cn(
                color === "blue"
                  ? "text-conditional-blue-500 dark:text-conditional-blue-500-dark"
                  : `placeholder:text-[light${color}]`
              )}
            >{`${(100 * median).toFixed(1)}%`}</span>
          </span>
        )}
        {mean != null && (
          <span className="ml-8 text-sm font-bold capitalize">
            {t("mean")}{" "}
            <span
              className={cn(
                color === "blue"
                  ? "text-conditional-blue-500 dark:text-conditional-blue-500-dark"
                  : `text-[light${color}]`
              )}
            >{`${(100 * mean).toFixed(1)}%`}</span>
          </span>
        )}
      </div>
      <VictoryChart
        theme={chartTheme}
        domain={{
          x: [0, 100],
          y: [0, maxY],
        }}
        containerComponent={
          <VictoryContainer
            responsive={true}
            style={{
              touchAction: "pan-y",
            }}
          />
        }
        padding={{ top: 0, bottom: 15, left: 10, right: 10 }}
        height={75}
        width={!!width ? width : undefined}
      >
        <VictoryAxis
          tickValues={range(0, 101)}
          tickFormat={(x: number) => (x % 10 === 0 ? `${x}%` : "")}
          style={{
            tickLabels: {
              fontSize: 8,
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
    </>
  );
};

export default Histogram;
