"use client";

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

import TrackRecordChartHero from "../track_record_chart_hero";
import dynamic from "next/dynamic";
import { range } from "lodash";

type HistogramProps = {
  rawHistogramData: TrackRecordHistogramItem[];
  color: string;
  scoreLabel: string;
  username?: string;
};

const UserHistogram: React.FC<HistogramProps> = ({
  rawHistogramData,
  color,
  scoreLabel,
  username
}) => {
  const histogramData = mapHistogramData(rawHistogramData);
  const yMax = Math.max(...histogramData.map((d) => d.y));
  const t = useTranslations();
  const { theme } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const ticksYFormat = (y: number) => {
    if (y % Math.round(yMax / 5) == 0) {
      return y.toString();
    } else {
      return "";
    }
  };
  const ticksXFormat = (x: number) => {
    if (x % 15 == 0) {
      return x.toString();
    } else {
      return "";
    }
  };

  const averageScore = useMemo(() => {
    const sum = histogramData.reduce((acc, { y }) => acc + y, 0);
    return Math.round((sum / histogramData.length) * 1000) / 1000;
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
          y: [0, yMax],
        }}
        containerComponent={<VictoryContainer responsive={true} />}
        padding={{ top: 20, bottom: 65, left: 40, right: 20 }}
        height={180}
      >
        <VictoryAxis
          dependentAxis
          offsetX={40}
          tickValues={range(0, yMax, Math.round(yMax / 40))}
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
          label={
            username
              ? t("userPeerScore", { username })
              : t("communityPredictionBaselineScore")
          }
        />
        <VictoryAxis
          tickValues={range(
            rawHistogramData[0].bin_start,
            rawHistogramData[rawHistogramData.length - 1].bin_end + 70,
            1
          )}
          tickFormat={ticksXFormat}
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
          label={scoreLabel}
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
    score_count: number;
  }[]
) => {
  const mappedArray = [] as { x: number; y: number }[];
  userHistogram.forEach((data, index) => {
    mappedArray.push(
      ...[
        { x: data.bin_start, y: Math.max(data.score_count, 0) },
        { x: data.bin_end - 1, y: Math.max(data.score_count, 0) },
      ]
    );
  });
  return mappedArray;
};

export default dynamic(() => Promise.resolve(UserHistogram), {
  ssr: false,
});