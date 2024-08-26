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
import classNames from "classnames";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

type HistogramProps = {
  histogramData: { x: number; y: number }[];
  median: number | undefined;
  mean: number | undefined;
  color: "blue" | "green";
};

const Histogram: React.FC<HistogramProps> = ({
  histogramData,
  median,
  mean,
  color,
}) => {
  const t = useTranslations();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const maxY = Math.max(...histogramData.map((d) => d.y));

  return (
    <>
      <div className="mb-2 text-center">
        {median != null && (
          <span className="text-sm font-bold capitalize">
            {t("median")}{" "}
            <span
              className={classNames(
                color === "blue"
                  ? "text-conditional-blue-500 dark:text-conditional-blue-500-dark"
                  : "text-conditional-green-500 dark:text-conditional-green-500-dark"
              )}
            >{`${(100 * median).toFixed(1)}%`}</span>
          </span>
        )}
        {mean != null && (
          <span className="ml-8 text-sm font-bold capitalize">
            {t("mean")}{" "}
            <span
              className={classNames(
                color === "blue"
                  ? "text-conditional-blue-500 dark:text-conditional-blue-500-dark"
                  : "text-conditional-green-500 dark:text-conditional-green-500-dark"
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
              fill: getThemeColor(
                color === "blue"
                  ? METAC_COLORS["conditional-blue"]["500"]
                  : METAC_COLORS["conditional-green"]["500"]
              ),
              stroke: getThemeColor(
                color === "blue"
                  ? METAC_COLORS["conditional-blue"]["500"]
                  : METAC_COLORS["conditional-green"]["500"]
              ),
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
