"use client";
import { range } from "lodash";
import dynamic from "next/dynamic";
import Link from "next/link";
import { useTranslations } from "next-intl";
import React, { ComponentProps, useCallback, useMemo, useState } from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryScatter,
  VictoryLine,
  Point,
} from "victory";

import ChartContainer from "@/components/charts/primitives/chart_container";
import XTickLabel from "@/components/charts/primitives/x_tick_label";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { TimelineChartZoomOption } from "@/types/charts";
import { TrackRecordScatterPlotItem } from "@/types/track_record";
import {
  generateNumericXDomain,
  generateTimestampXScale,
} from "@/utils/charts/axis";

import TrackRecordChartHero from "../track_record_chart_hero";

type HistogramProps = {
  score_scatter_plot: TrackRecordScatterPlotItem[];
  username?: string;
};

const ScatterPlot: React.FC<HistogramProps> = ({
  score_scatter_plot,
  username,
}) => {
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

  const [hoverIndex, setHoverIndex] = useState<number | null>(null);
  const [clickIndex, setClickIndex] = useState<number | null>(null);

  const hoverData = useMemo(() => {
    if (
      (hoverIndex === null && clickIndex === null) ||
      (hoverIndex !== null && !score_scatter_plot[hoverIndex]) ||
      (clickIndex !== null && !score_scatter_plot[clickIndex])
    ) {
      return null;
    }

    if (clickIndex !== null) {
      if (hoverIndex !== null) {
        return score_scatter_plot[hoverIndex];
      }
      const point = score_scatter_plot[clickIndex];
      if (!point) {
        return null;
      }
      return point;
    }
    if (hoverIndex === null) {
      return null;
    }
    const point = score_scatter_plot[hoverIndex];
    if (!point) {
      return null;
    }
    return point;
  }, [hoverIndex, clickIndex, score_scatter_plot]);

  const averageScore = useMemo(() => {
    const sum = score_scatter_plot.reduce((acc, { score }) => acc + score, 0);
    return (sum / score_scatter_plot.length).toFixed(3);
  }, [score_scatter_plot]);
  const yMin = Math.min(-100, ...score_scatter_plot.map((data) => data.score));
  const yMax = Math.max(100, ...score_scatter_plot.map((data) => data.score));

  const handleChartClick = useCallback((event: React.MouseEvent) => {
    const target = event.target as Element;
    if (target.tagName.toLowerCase() !== "path") {
      setClickIndex(null);
    }
  }, []);

  return (
    <>
      <TrackRecordChartHero
        totalQuestions={score_scatter_plot.length.toString()}
        averageScore={averageScore}
      />

      <ChartContainer ref={chartContainerRef} height={350}>
        <div className="size-full" onClick={handleChartClick}>
          <VictoryChart
            theme={chartTheme}
            domain={{
              x: xDomain,
              y: [yMin, yMax],
            }}
            domainPadding={{
              x: 10,
            }}
            padding={{ top: 20, bottom: 65, left: 40, right: 20 }}
            height={350}
            width={chartWidth}
          >
            <VictoryScatter
              name={"scatter"}
              data={score_scatter_plot.map((point, index) => ({
                x: point.score_timestamp,
                y: point.score,
                size: index === hoverIndex ? 6 : 5,
              }))}
              style={{
                data: {
                  zIndex: 100,
                  stroke: getThemeColor(METAC_COLORS.gold["500"]),
                  fill: "none",
                  strokeWidth: 1,
                },
              }}
              events={[
                {
                  target: "data",
                  childName: "scatter",
                  eventHandlers: {
                    onMouseOver: (_event, datum) => {
                      setHoverIndex(datum.index);
                    },
                    onMouseOut: () => {
                      setHoverIndex(null);
                    },
                    onClick: () => [
                      {
                        target: "data",
                        mutation: (props: any) => {
                          setClickIndex((prev) =>
                            prev === props.index ? null : props.index
                          );
                        },
                      },
                    ],
                  },
                },
              ]}
              dataComponent={
                <CustomPoint hoverIndex={hoverIndex} clickIndex={clickIndex} />
              }
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
              label={
                username
                  ? t("userPeerScore", { username })
                  : t("communityPredictionBaselineScore")
              }
            />
            <VictoryAxis
              tickValues={xScale.ticks}
              tickFormat={xScale.tickFormat}
              offsetY={65}
              label={t("scheduledCloseTime")}
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
        </div>
      </ChartContainer>
      <div className="ml-16 mr-7 min-h-[80px] text-sm">
        {hoverData ? (
          <>
            <Link
              href={`/questions/${hoverData.post_id}`}
              className="block text-center underline"
            >
              {hoverData.question_title}
            </Link>
            <div className="text-center capitalize">
              {t("resolutionLabel")} {hoverData.question_resolution}
            </div>
            <div className="text-center">
              {t("score")}: {Math.round(hoverData.score * 1000) / 1000}
            </div>
          </>
        ) : (
          <div className="text-center">{t("scatterPlotHoverMessage")}</div>
        )}
      </div>
      <span className="pt-3 text-sm text-gray-600 dark:text-gray-400">
        The Score Scatter Plot shows the set of{" "}
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
        scores the forecaster achieved over time. Each circle represents a score
        acheived on a particular question, and the trend line is a moving
        average of the scores.
      </span>
    </>
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

  const yMin = Math.min(-100, ...score_scatter_plot.map((data) => data.score));
  const yMax = Math.max(100, ...score_scatter_plot.map((data) => data.score));
  const ticksY = range(
    Math.round(yMin / 10) * 10,
    Math.round(yMax / 10) * 10,
    5
  );
  const ticksYFormat = (y: number) => {
    if (y % 50 == 0) {
      return y.toString();
    } else {
      return "";
    }
  };
  const xDomain = generateNumericXDomain(
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

type CustomPointProps = {
  hoverIndex: number | null;
  clickIndex: number | null;
};
const CustomPoint = ({
  hoverIndex,
  clickIndex,
  ...props
}: ComponentProps<typeof Point> & CustomPointProps) => {
  const { getThemeColor } = useAppTheme();

  const isHovered = props.index === hoverIndex;
  const isClicked = props.index === clickIndex;

  return (
    <Point
      {...props}
      style={{
        ...props.style,
        fill: isClicked
          ? getThemeColor(METAC_COLORS.gold["500"])
          : "transparent",
        stroke: getThemeColor(METAC_COLORS.gold["500"]),
        strokeWidth: isHovered ? 3 : 1,
      }}
    />
  );
};

export default dynamic(() => Promise.resolve(ScatterPlot), {
  ssr: false,
});
