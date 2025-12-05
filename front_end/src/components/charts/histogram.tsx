"use client";

import { range } from "lodash";
import { useTranslations } from "next-intl";
import React from "react";
import {
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryLabel,
  VictoryPortal,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";

import ChartContainer from "./primitives/chart_container";

type HistogramProps = {
  histogramData: { x: number; y: number }[];
  median: number | null | undefined;
  mean: number | null | undefined;
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
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const maxY = Math.max(...histogramData.map((d) => d.y));

  return (
    <>
      <div className="mb-2 text-center">
        {median != null && (
          <span className="text-sm font-bold capitalize">
            {t("median")}{" "}
            <span
              style={{
                color: getThemeColor(
                  color === "blue"
                    ? METAC_COLORS.blue["500"]
                    : METAC_COLORS.gray["500"]
                ),
              }}
            >{`${(100 * median).toFixed(1)}%`}</span>
          </span>
        )}
        {mean != null && (
          <span className="ml-8 text-sm font-bold capitalize">
            {t("mean")}{" "}
            <span
              style={{
                color: getThemeColor(
                  color === "blue"
                    ? METAC_COLORS.blue["500"]
                    : METAC_COLORS.gray["500"]
                ),
              }}
            >{`${(100 * mean).toFixed(1)}%`}</span>
          </span>
        )}
      </div>
      <ChartContainer ref={chartContainerRef} height={75}>
        <VictoryChart
          theme={chartTheme}
          domain={{
            x: [0, 100],
            y: [0, maxY * 1.01], // prevent highest bar being cut off
          }}
          containerComponent={
            <VictoryContainer
              responsive={true}
              style={{
                touchAction: "pan-y",
              }}
            />
          }
          padding={{ top: 0, bottom: 20, left: 12, right: 12 }}
          height={75}
          width={!!width ? width : undefined}
        >
          <VictoryBar
            data={histogramData}
            style={{
              data: {
                borderTop: "1px solid",
                borderTopColor: getThemeColor(
                  color === "blue"
                    ? METAC_COLORS.blue["500"]
                    : METAC_COLORS.gray["500"]
                ),
                fill: getThemeColor(
                  color === "blue"
                    ? METAC_COLORS.blue["500"]
                    : METAC_COLORS.gray["500"]
                ),
              },
            }}
            barRatio={0.85}
            alignment="start"
          />
          {/* Top line bars */}
          <VictoryBar
            data={histogramData}
            style={{
              data: {
                fill: getThemeColor(
                  color === "blue"
                    ? METAC_COLORS.blue["800"]
                    : METAC_COLORS.gray["800"]
                ),
              },
            }}
            barRatio={0.85}
            alignment="start"
            getPath={(props: unknown) => {
              const { x0, x1, y1, datum } = props as {
                x0: number;
                x1: number;
                y1: number;
                datum: { y: number };
              };

              if (!datum || datum.y === 0) return "";

              return `M ${x0}, ${y1}
                L ${x1}, ${y1}
                L ${x1}, ${y1 + 1}
                L ${x0}, ${y1 + 1}
                z`;
            }}
          />
          <VictoryAxis
            tickValues={chartWidth > 400 ? range(0, 101) : range(0, 101, 5)}
            tickFormat={(x: number) =>
              chartWidth > 400
                ? x % 10 === 0
                  ? `${x}%`
                  : ""
                : [0, 50, 100].includes(x)
                  ? `${x}%`
                  : ""
            }
            tickLabelComponent={
              <VictoryPortal>
                <VictoryLabel dy={3} />
              </VictoryPortal>
            }
            style={{
              tickLabels: {
                fontSize: 10,
                fontWeight: 400,
                fill: getThemeColor(METAC_COLORS.gray["700"]),
              },
              ticks: {
                stroke: getThemeColor(
                  color === "blue"
                    ? METAC_COLORS.blue["400"]
                    : METAC_COLORS.gray["400"]
                ),
              },
              axis: {
                stroke: getThemeColor(
                  color === "blue"
                    ? METAC_COLORS.blue["400"]
                    : METAC_COLORS.gray["400"]
                ),
              },
              grid: { stroke: "none" },
            }}
          />
        </VictoryChart>
      </ChartContainer>
    </>
  );
};

export default Histogram;
