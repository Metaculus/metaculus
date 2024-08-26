"use client";

import { range } from "lodash";
import { useTranslations } from "next-intl";
import React, { useMemo } from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryArea,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import useAppTheme from "@/hooks/use_app_theme";
import { TrackRecordHistogramItem } from "@/types/track_record";
import { generateTicksY } from "@/utils/charts";

import TrackRecordChartHero from "../track_record_chart_hero";

type HistogramProps = {
  rawHistogramData: TrackRecordHistogramItem[];
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

  const { ticks: ticksY, tickFormat: ticksYFormat } = generateTicksY(
    180,
    [0.0, 0.2, 0.4, 0.6, 0.8, 1.0]
  );

  const averageScore = useMemo(() => {
    const sum = histogramData.reduce((acc, { y }) => acc + y, 0);

    return Math.round((sum / histogramData.length) * 1000);
  }, [histogramData]);

  return (
    <>
      <TrackRecordChartHero
        totalQuestions={histogramData.length.toString()}
        averageScore={averageScore.toString()}
      />

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
    </>
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

export default UserHistogram;
