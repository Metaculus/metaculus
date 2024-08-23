"use client";

import { useTranslations } from "next-intl";
import React from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryScatter,
  VictoryLine,
} from "victory";

import ChartContainer from "@/components/charts/primitives/chart_container";
import XTickLabel from "@/components/charts/primitives/x_tick_label";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { TimelineChartZoomOption } from "@/types/charts";
import {
  generateNumericDomain,
  generateTicksY,
  generateTimestampXScale,
} from "@/utils/charts";

type HistogramProps = {
  score_scatter_plot: { score: number; score_timestamp: number }[];
};

const ScatterPlot: React.FC<HistogramProps> = ({ score_scatter_plot }) => {
  const t = useTranslations();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const {
    overallAverage,
    movingAverage,
    ticksY,
    ticksYFormat,
    xDomain,
    xScale,
  } = buildChartData({ score_scatter_plot, chartWidth });

  return (
    <ChartContainer ref={chartContainerRef} height={350}>
      <VictoryChart
        theme={chartTheme}
        domain={{
          x: xDomain,
          y: [-100, 100],
        }}
        domainPadding={{
          x: 10,
        }}
        padding={{ top: 20, bottom: 65, left: 40, right: 20 }}
        height={350}
        width={chartWidth}
      >
        <VictoryScatter
          data={score_scatter_plot.map((point) => {
            return {
              x: point.score_timestamp,
              y: point.score,
              size: 5,
            };
          })}
          style={{
            data: {
              stroke: getThemeColor(METAC_COLORS.blue["600"]),
              fill: "none",
              strokeWidth: 1,
            },
          }}
        />
        <VictoryLine
          y={overallAverage}
          style={{
            data: {
              stroke: getThemeColor(METAC_COLORS.gray["400"]),
              strokeDasharray: "5, 2",
            },
          }}
        />
        <VictoryLine
          data={movingAverage}
          style={{
            data: {
              stroke: getThemeColor(METAC_COLORS.gray["800"]),
            },
          }}
        />
        <VictoryAxis
          dependentAxis
          offsetX={40}
          tickValues={ticksY}
          tickFormat={ticksYFormat}
          style={{
            tickLabels: {
              fontSize: 10,
            },
            axisLabel: {
              fontSize: 13,
            },
            axis: { stroke: chartTheme.axis?.style?.axis?.stroke },
          }}
          label={`Metaculus ${t("brierScore")}`}
        />
        <VictoryAxis
          tickValues={xScale.ticks}
          tickFormat={xScale.tickFormat}
          offsetY={65}
          label={t("closingTime")}
          style={{
            tickLabels: {
              fontSize: 10,
            },
            axisLabel: {
              fontSize: 13,
            },
            axis: { stroke: chartTheme.axis?.style?.axis?.stroke },
            grid: { stroke: "none" },
          }}
          tickLabelComponent={<XTickLabel chartWidth={chartWidth} />}
        />
      </VictoryChart>
    </ChartContainer>
  );
};

function buildChartData({
  score_scatter_plot,
  chartWidth,
}: {
  score_scatter_plot: { score: number; score_timestamp: number }[];
  chartWidth: number;
}) {
  const overallAverage =
    score_scatter_plot.length === 0
      ? 0
      : score_scatter_plot.reduce((reducer, data) => {
          return reducer + data.score;
        }, 0) / score_scatter_plot.length;

  let scoreLocalSum = 0;
  const movingAverage = score_scatter_plot.map((data, index) => {
    scoreLocalSum += data.score;
    return {
      x: data.score_timestamp,
      y: scoreLocalSum / (index + 1),
    };
  });

  const { ticks: ticksY, tickFormat: ticksYFormat } = generateTicksY(
    270,
    [-100, -50, 0, 50, 100]
  );
  const xDomain = generateNumericDomain(
    score_scatter_plot.map((data) => data.score_timestamp),
    "all" as TimelineChartZoomOption
  );
  const xScale = generateTimestampXScale(xDomain, chartWidth);

  return {
    overallAverage,
    movingAverage,
    ticksY,
    ticksYFormat,
    xDomain,
    xScale,
  };
}

export default ScatterPlot;
