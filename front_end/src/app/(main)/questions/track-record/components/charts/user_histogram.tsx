"use client";

import { range } from "lodash";
import dynamic from "next/dynamic";
import Link from "next/link";
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
import { TrackRecordHistogramItem } from "@/types/track_record";

type HistogramProps = {
  rawHistogramData: TrackRecordHistogramItem[];
  color: string;
  username?: string;
};

const UserHistogram: React.FC<HistogramProps> = ({
  rawHistogramData,
  color,
  username,
}) => {
  const histogramData = mapHistogramData(rawHistogramData);

  const yMax = Math.max(1, ...histogramData.map((d) => d.y));
  const t = useTranslations();
  const { theme } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const ticksXFormat = (x: number) => {
    if (x % 15 == 0) {
      return x.toString();
    } else {
      return "";
    }
  };

  const yLowestTen = Math.floor(yMax / 10);
  const ticksY = Array.from({ length: 11 }, (_, i) =>
    Math.round(i * yLowestTen)
  );
  ticksY.push(yMax);
  const ticksYFormat = (y: number) => {
    return (y % (yLowestTen * 2) === 0 && yMax - y > yLowestTen * 2) ||
      y === yMax
      ? Math.round(y).toString()
      : "";
  };

  return (
    <>
      <VictoryChart
        theme={chartTheme}
        domain={{
          x: [
            rawHistogramData[0]?.bin_start ?? 1,
            rawHistogramData[(rawHistogramData.length ?? 1) - 1]?.bin_end ?? 0,
          ],
          y: [0, yMax],
        }}
        containerComponent={<VictoryContainer responsive={true} />}
        padding={{ top: 20, bottom: 40, left: 40, right: 20 }}
        height={180}
      >
        <VictoryAxis
          dependentAxis
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
          label={t("count")}
        />
        <VictoryAxis
          tickValues={range(
            rawHistogramData[0]?.bin_start ?? 1,
            (rawHistogramData[(rawHistogramData.length ?? 1) - 1]?.bin_end ??
              0) + 70,
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
          label={
            username
              ? t("userPeerScore", { username })
              : t("communityPredictionBaselineScore")
          }
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
      <span className="pt-3 text-sm text-gray-600 dark:text-gray-400">
        The Score Histogram shows the distribution of{" "}
        {username ? (
          <Link
            href="/help/scores-faq/#peer-score"
            className="text-blue-700 hover:text-blue-800 dark:text-blue-300 hover:dark:text-blue-200"
          >
            Peer
          </Link>
        ) : (
          <Link
            href="/help/scores-faq/#baseline-score"
            className="text-blue-700 hover:text-blue-800 dark:text-blue-300 hover:dark:text-blue-200"
          >
            Baseline
          </Link>
        )}{" "}
        scores the forecaster achieved.
        <br />
        <br />
      </span>
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
