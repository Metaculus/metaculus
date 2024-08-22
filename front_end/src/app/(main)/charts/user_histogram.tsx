"use client";

import { range } from "lodash";
import { useTranslations } from "next-intl";
import React from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryArea,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import useAppTheme from "@/hooks/use_app_theme";

type HistogramProps = {
  rawHistogramData: {
    bin_start: number;
    bin_end: number;
    pct_scores: number;
  }[];
  color: string;
};

const UserHistogram: React.FC<HistogramProps> = ({
  rawHistogramData,
  color,
}) => {
  const histogramData = mapHistogramData(rawHistogramData);
  const t = useTranslations();
  const { theme } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const { ticks: ticksY, tickFormat: ticksYFormat } = generateTicksY(180);
  return (
    <div className="mb-5 size-full">
      <VictoryChart
        theme={chartTheme}
        domain={{
          x: [
            rawHistogramData[0].bin_start ?? 1,
            rawHistogramData[rawHistogramData.length - 1].bin_end ?? 0,
          ],
          y: [0, 1],
        }}
        containerComponent={<VictoryContainer responsive={true} />}
        padding={{ top: 20, bottom: 65, left: 40, right: 20 }}
        height={180}
      >
        <VictoryAxis
          dependentAxis
          domain={{
            x: [
              rawHistogramData[0].bin_start ?? 1,
              rawHistogramData[rawHistogramData.length - 1].bin_end ?? 0,
            ],
            y: [0, 1],
          }}
          offsetX={40}
          tickValues={ticksY}
          tickFormat={ticksYFormat}
          style={{
            tickLabels: {
              fontSize: 5,
            },
            axisLabel: {
              fontSize: 6.5,
            },
            axis: { stroke: chartTheme.axis?.style?.axis?.stroke },
          }}
          label={t("frequency")}
        />
        <VictoryAxis
          tickValues={range(
            rawHistogramData[0].bin_start,
            rawHistogramData[rawHistogramData.length - 1].bin_end + 70,
            70
          )}
          style={{
            tickLabels: {
              fontSize: 5,
            },
            axisLabel: {
              fontSize: 6.5,
            },
            axis: { stroke: chartTheme.axis?.style?.axis?.stroke },
            grid: { stroke: "none" },
          }}
          label={t("brierScoreForPlayer")}
        />
        <VictoryArea
          data={histogramData}
          style={{
            data: {
              strokeWidth: 1.5,
              fill: "light" + color,
              stroke: "dark" + color,
            },
          }}
          interpolation="stepAfter"
        />
      </VictoryChart>
    </div>
  );
};

const mapHistogramData = (
  userHistogram: {
    bin_start: number;
    bin_end: number;
    pct_scores: number;
  }[]
) => {
  const mappedArray = [] as { x: number; y: number }[];
  userHistogram.forEach((data, index) => {
    mappedArray.push(
      ...[
        { x: data.bin_start, y: Math.max(data.pct_scores, 0) },
        { x: data.bin_end - 1, y: Math.max(data.pct_scores, 0) },
      ]
    );
  });
  return mappedArray;
};

function generateTicksY(height: number) {
  const desiredMajorTicks = [0.0, 0.2, 0.4, 0.6, 0.8, 1.0];
  const minorTicksPerMajor = 9;
  const desiredMajorTickDistance = 20;
  let majorTicks = desiredMajorTicks;
  const maxMajorTicks = Math.floor(height / desiredMajorTickDistance);

  if (maxMajorTicks < desiredMajorTicks.length) {
    const step = 1 / (maxMajorTicks - 1);
    majorTicks = Array.from({ length: maxMajorTicks }, (_, i) => i * step);
  }
  const ticks = [];
  for (let i = 0; i < majorTicks.length - 1; i++) {
    ticks.push(majorTicks[i]);
    const step = (majorTicks[i + 1] - majorTicks[i]) / (minorTicksPerMajor + 1);
    for (let j = 1; j <= minorTicksPerMajor; j++) {
      ticks.push(majorTicks[i] + step * j);
    }
  }
  ticks.push(majorTicks[majorTicks.length - 1]);
  const tickFormat = (value: number): string => {
    if (!majorTicks.includes(value)) {
      return "";
    }
    return value.toString();
  };
  return { ticks, tickFormat };
}

export default UserHistogram;
