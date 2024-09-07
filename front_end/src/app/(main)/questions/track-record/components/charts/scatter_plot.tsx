"use client";
import { range } from "lodash";

import { useTranslations } from "next-intl";
import React, { useMemo, useState } from "react";
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
import { TrackRecordScatterPlotItem } from "@/types/track_record";
import { generateNumericDomain, generateTimestampXScale } from "@/utils/charts";

import TrackRecordChartHero from "../track_record_chart_hero";

type HistogramProps = {
  score_scatter_plot: TrackRecordScatterPlotItem[];
  scoreLabel: string;
};

const ScatterPlot: React.FC<HistogramProps> = ({
  score_scatter_plot,
  scoreLabel,
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

  const [activeIndex, setActiveIndex] = useState(null);
  const hoverData = useMemo(() => {
    if (activeIndex === null || !score_scatter_plot[activeIndex]) {
      return null;
    }

    const point = score_scatter_plot[activeIndex];
    if (!point) {
      return null;
    }

    return point;
  }, [activeIndex, score_scatter_plot]);

  const averageScore = useMemo(() => {
    const sum = score_scatter_plot.reduce((acc, { score }) => acc + score, 0);
    return (sum / score_scatter_plot.length).toFixed(3);
  }, [score_scatter_plot]);
  const yMin = Math.min(-100, ...score_scatter_plot.map((data) => data.score));
  const yMax = Math.max(100, ...score_scatter_plot.map((data) => data.score));

  return (
    <>
      <TrackRecordChartHero
        totalQuestions={score_scatter_plot.length.toString()}
        averageScore={averageScore}
      />

      <ChartContainer ref={chartContainerRef} height={350}>
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
            data={score_scatter_plot.map((point, index) => {
              return {
                x: point.score_timestamp,
                y: point.score,
                size: index === activeIndex ? 6 : 5,
              };
            })}
            style={{
              data: {
                stroke: getThemeColor(METAC_COLORS.blue["600"]),
                fill: "none",
                strokeWidth: 1,
              },
            }}
            events={[
              {
                target: "data",
                eventHandlers: {
                  onMouseOver: (_event, datum) => {
                    setActiveIndex(datum.index);
                    return {
                      mutation: (props) => {
                        return {
                          style: Object.assign({}, props.style, {
                            strokeWidth: 3,
                          }),
                        };
                      },
                    };
                  },
                  onMouseOut: () => {
                    setActiveIndex(null);
                    return {
                      mutation: () => null,
                    };
                  },
                },
              },
            ]}
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
            label={scoreLabel}
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
      <div className="ml-16 mr-7 text-sm">
        {hoverData ? (
          <>
            <div className="text-center underline">
              {hoverData.question_title}
            </div>
            <div className="text-center capitalize">
              {t("resolutionLabel")} {hoverData.question_resolution}
            </div>
          </>
        ) : (
          <div className="text-center">{t("scatterPlotHoverMessage")}</div>
        )}
      </div>
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
