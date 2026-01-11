"use client";
import { isNil, merge } from "lodash";
import React, { FC, useMemo } from "react";
import {
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryLine,
  VictoryScatter,
  VictoryThemeDefinition,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import {
  ContinuousAreaGraphType,
  ContinuousAreaType,
  Line,
  ScaleDirection,
} from "@/types/charts";
import {
  GraphingQuestionProps,
  Question,
  QuestionType,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { generateScale } from "@/utils/charts/axis";
import { getClosestYValue, interpolateYValue } from "@/utils/charts/helpers";
import { getResolutionPoint } from "@/utils/charts/resolution";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { cdfToPmf, computeQuartilesFromCDF } from "@/utils/math";

type ContinuousAreaColor = "orange" | "green" | "gray";
const CHART_COLOR_MAP: Record<ContinuousAreaType, ContinuousAreaColor> = {
  community: "green",
  community_closed: "gray",
  user: "orange",
  user_previous: "orange",
  user_components: "orange",
};

export type ContinuousAreaGraphInput = Array<{
  pmf: number[];
  cdf: number[];
  componentCdfs?: number[][] | null;
  type: ContinuousAreaType;
}>;

const BOTTOM_PADDING = 15;
const HORIZONTAL_PADDING = 10;

type Props = {
  question: Question | GraphingQuestionProps;
  data: ContinuousAreaGraphInput | null;
  height?: number;
  width?: number;
  extraTheme?: VictoryThemeDefinition;
  hideCP?: boolean;
  hideLabels?: boolean;
  shortLabels?: boolean;
  alignChartTabs?: boolean;
  forceTickCount?: number;
  variant?: "feed" | "question";
};

const MinifiedContinuousAreaChart: FC<Props> = ({
  question,
  data,
  height = 150,
  width = undefined,
  extraTheme,
  hideCP,
  hideLabels = false,
  shortLabels = false,
  alignChartTabs,
  forceTickCount,
  variant = "feed",
}) => {
  if (data === null) {
    throw new Error("Data for MinifiedContinuousAreaChart is null");
  }
  const { ref: chartContainerRef, width: containerWidth } =
    useContainerSize<HTMLDivElement>();
  const chartWidth = width || containerWidth;
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const discrete = question.type === QuestionType.Discrete;

  const charts = useMemo(() => {
    const parsedData = hideCP ? [] : data;

    const chartData: NumericPredictionGraph[] = [];
    for (const datum of parsedData) {
      const { pmf, cdf, componentCdfs } = datum;
      chartData.push(
        generateNumericAreaGraph({
          pmf,
          cdf,
          graphType: "pmf",
          type: datum.type,
          question,
        })
      );
      if (componentCdfs && componentCdfs.length > 1) {
        for (const componentCdf of componentCdfs) {
          chartData.push(
            generateNumericAreaGraph({
              pmf: cdfToPmf(componentCdf),
              cdf: componentCdf,
              graphType: "pmf",
              type: "user_components",
              question,
            })
          );
        }
      }
    }
    return chartData;
  }, [data, hideCP, question]);

  const { xDomain, yDomain } = useMemo<{
    xDomain: Tuple<number>;
    yDomain: Tuple<number>;
  }>(() => {
    if (question.type !== QuestionType.Discrete) {
      const maxValue = Math.max(
        ...data.map((x) => x.pmf.slice(1, x.pmf.length - 1)).flat()
      );
      return {
        xDomain: [0, 1],
        yDomain: [0, 1.2 * (maxValue <= 0 ? 1 : maxValue)],
      };
    }
    const xDomain: Tuple<number> = [
      Math.min(
        ...charts.map((chart) => 2 * (chart.graphLine.at(0)?.x ?? 0)),
        0
      ),
      Math.max(
        ...charts.map(
          (chart) => 1 + 2 * ((chart.graphLine.at(-1)?.x ?? 1) - 1)
        ),
        1
      ),
    ];

    const maxValue = Math.max(...data.map((x) => x.pmf).flat());
    return {
      xDomain: xDomain,
      yDomain: [0, Math.min(1, 1.2 * (maxValue <= 0 ? 1 : maxValue))],
    };
  }, [data, question.type, charts]);

  const xScale = useMemo(
    () =>
      generateScale({
        displayType: question.type,
        axisLength: chartWidth,
        direction: ScaleDirection.Horizontal,
        domain: xDomain,
        shortLabels,
        adjustLabels: true,
        question: question,
        forceTickCount,
        alwaysShowTicks: true,
      }),
    [chartWidth, question, xDomain, shortLabels, forceTickCount]
  );
  const yScale = useMemo(
    () =>
      generateScale({
        displayType: QuestionType.Binary,
        axisLength: height - BOTTOM_PADDING,
        direction: ScaleDirection.Vertical,
        domain: yDomain,
        zoomedDomain: yDomain,
        adjustLabels: true,
      }),
    [height, yDomain]
  );

  const resolutionPoint =
    !isNil(question.resolution) && question.resolution !== ""
      ? getResolutionPoint({
          questionType: question.type,
          resolution: question.resolution,
          resolveTime: 1,
          scaling: question.scaling,
          inboundOutcomeCount: question.inbound_outcome_count,
        })
      : null;

  const horizontalPadding = useMemo(() => {
    if (alignChartTabs || question.type === QuestionType.Discrete) {
      const labels = yScale.ticks.map((tick) => yScale.tickFormat(tick));
      const longestLabelLength = Math.max(
        ...labels.map((label) => label.length)
      );
      const longestLabelWidth = Math.max(5, longestLabelLength) * 5;

      return HORIZONTAL_PADDING + longestLabelWidth;
    }

    return HORIZONTAL_PADDING;
  }, [yScale, question.type, alignChartTabs]);

  const barWidth = useMemo(() => {
    if (question.type !== QuestionType.Discrete) {
      return (chartWidth - 30) / (1.07 * ((data.at(0)?.cdf.length || 200) - 1));
    }
    const openBoundCount =
      (question.open_lower_bound ? 1 : 0) + (question.open_upper_bound ? 1 : 0);
    return (
      (chartWidth - horizontalPadding) /
      (1.09 * ((question.inbound_outcome_count || 200) + openBoundCount))
    );
  }, [chartWidth, data, question, horizontalPadding]);

  const bottomPadding = useMemo(() => {
    // When labels are hidden, use minimal padding (just 2-3px for visual spacing)
    // When labels are shown, use full padding to accommodate text
    // However, if there's a resolution point, we need extra padding to prevent clipping
    const hasResolution =
      !isNil(question.resolution) && question.resolution !== "";
    const baseMinimalPadding = hasResolution ? 8 : 3; // Extra padding for resolution diamond
    return hideCP || hideLabels ? baseMinimalPadding : BOTTOM_PADDING;
  }, [hideCP, hideLabels, question.resolution]);

  return (
    <div ref={chartContainerRef} className="h-full w-full" style={{ height }}>
      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={actualTheme}
          padding={{
            top: 0,
            left: horizontalPadding,
            bottom: bottomPadding,
            right: horizontalPadding,
          }}
          domain={{ x: xDomain, y: yDomain }}
          containerComponent={
            <VictoryContainer
              style={{
                pointerEvents: "auto",
                userSelect: "auto",
                touchAction: "auto",
              }}
            />
          }
        >
          {charts
            .filter((chart) => chart.type !== "user_components")
            .map((chart, index) => {
              if (!discrete) {
                return (
                  <VictoryArea
                    key={`area-${index}`}
                    data={chart.graphLine}
                    y0={yDomain[0]}
                    style={{
                      data: {
                        fill: (() => {
                          if (extraTheme?.area?.style?.data?.fill) {
                            return extraTheme.area.style.data.fill;
                          }
                          switch (chart.color) {
                            case "orange":
                              return getThemeColor(
                                METAC_COLORS.orange[
                                  chart.type === "user" ? "500" : "400"
                                ]
                              );
                            case "green":
                              return getThemeColor(METAC_COLORS.olive["600"]);
                            case "gray":
                              return getThemeColor(METAC_COLORS.gray["500"]);
                            default:
                              return undefined;
                          }
                        })(),
                        opacity: chart.type === "user_previous" ? 0.1 : 0.3,
                      },
                    }}
                  />
                );
              }
              return (
                <VictoryBar
                  key={`bar-${index}`}
                  data={chart.graphLine}
                  y0={yDomain[0]}
                  style={{
                    data: {
                      fill: (() => {
                        if (extraTheme?.area?.style?.data?.fill) {
                          return extraTheme.area.style.data.fill;
                        }
                        switch (chart.color) {
                          case "orange":
                            return getThemeColor(
                              METAC_COLORS.orange[
                                chart.type === "user" ? "500" : "400"
                              ]
                            );
                          case "green":
                            return getThemeColor(METAC_COLORS.olive["500"]);
                          case "gray":
                            return getThemeColor(METAC_COLORS.gray["500"]);
                          default:
                            return undefined;
                        }
                      })(),
                      opacity: chart.type === "user_previous" ? 0.1 : 0.3,
                    },
                  }}
                  barWidth={barWidth}
                />
              );
            })}

          {/* Upper edge border lines */}
          {charts
            .filter((chart) => chart.type !== "user_components")
            .map((chart, index) => (
              <VictoryLine
                key={`border-${index}`}
                data={chart.graphLine}
                style={{
                  data: {
                    stroke: (() => {
                      switch (chart.color) {
                        case "orange":
                          return getThemeColor(METAC_COLORS.orange["600"]);
                        case "green":
                          return getThemeColor(METAC_COLORS.olive["600"]);
                        case "gray":
                          return getThemeColor(METAC_COLORS.gray["600"]);
                        default:
                          return getThemeColor(METAC_COLORS.olive["600"]);
                      }
                    })(),
                    strokeWidth: 1,
                    fill: "none",
                  },
                }}
              />
            ))}

          <VictoryAxis
            tickValues={xScale.ticks}
            tickFormat={hideCP || hideLabels ? () => "" : xScale.tickFormat}
            style={{
              ticks: {
                strokeWidth: 1,
                stroke: "transparent",
              },
              axis: {
                stroke: getThemeColor(METAC_COLORS.olive["100"]),
                strokeWidth: 0,
                strokeDasharray: "4, 4",
              },
              tickLabels: {
                fontSize: variant === "feed" ? 10 : 8,
                textAnchor: ({ index, ticks }) =>
                  // We want first and last labels be aligned against area boundaries
                  index === 0
                    ? "start"
                    : index === ticks.length - 1
                      ? "end"
                      : "middle",
                fill: getThemeColor(METAC_COLORS.gray["500"]),
                fontFamily: "Inter",
              },
            }}
          />
          {charts.map((chart, k) =>
            chart.verticalLines.map((line, index) =>
              index === 1 && chart.color !== "orange" ? (
                <VictoryLine
                  key={`${k}-${index}`}
                  data={[
                    { x: line.x, y: 0 },
                    { x: line.x, y: line.y },
                  ]}
                  style={{
                    data: {
                      stroke: (() => {
                        switch (chart.color) {
                          case "gray":
                            return getThemeColor(METAC_COLORS.gray["500"]);
                          default:
                            return getThemeColor(METAC_COLORS.olive["700"]);
                        }
                      })(),
                      strokeWidth: 1,
                    },
                  }}
                />
              ) : null
            )
          )}
          {/* Circles at median line tops */}
          {charts.map((chart, k) =>
            chart.verticalLines.map((line, index) =>
              index === 1 && chart.color !== "orange" ? (
                <VictoryScatter
                  key={`median-circle-${k}-${index}`}
                  data={[{ x: line.x, y: line.y }]}
                  style={{
                    data: {
                      fill: (() => {
                        switch (chart.color) {
                          case "gray":
                            return getThemeColor(METAC_COLORS.gray["600"]);
                          default:
                            return getThemeColor(METAC_COLORS.olive["800"]);
                        }
                      })(),
                      stroke: (() => {
                        switch (chart.color) {
                          case "gray":
                            return getThemeColor(METAC_COLORS.gray["600"]);
                          default:
                            return getThemeColor(METAC_COLORS.olive["800"]);
                        }
                      })(),
                      strokeWidth: 1,
                    },
                  }}
                  size={3}
                />
              ) : null
            )
          )}

          {/* Resolution point */}
          {resolutionPoint && (
            <VictoryScatter
              data={[
                {
                  x: resolutionPoint.y,
                  y: yDomain[0], // Use bottom of domain
                  symbol: "diamond",
                  size: 3.5, // Much larger for visibility
                },
              ]}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS.purple["800"]),
                  fill: getThemeColor(METAC_COLORS.gray["0"]),
                  strokeWidth: 2,
                },
              }}
            />
          )}
        </VictoryChart>
      )}
    </div>
  );
};

type NumericPredictionGraph = {
  graphLine: Line;
  verticalLines: Line;
  color: ContinuousAreaColor;
  type: ContinuousAreaType;
  graphType: ContinuousAreaGraphType;
};

function generateNumericAreaGraph(data: {
  pmf: number[];
  cdf: number[];
  graphType: ContinuousAreaGraphType;
  type: ContinuousAreaType;
  question: Question | GraphingQuestionProps;
}): NumericPredictionGraph {
  const { pmf, cdf, graphType, type, question } = data;

  const graph: Line = [];
  if (question.type === QuestionType.Discrete) {
    if (graphType === "cdf") {
      if (question.open_lower_bound) {
        graph.push({
          x: -0.5 / (cdf.length - 1),
          y: cdf.at(0) ?? 0,
        });
      }
      cdf.slice(1).forEach((value, index) => {
        graph.push({ x: (index + 0.5) / (cdf.length - 1), y: value });
      });
      if (question.open_upper_bound) {
        graph.push({
          x: (cdf.length - 0.5) / (cdf.length - 1),
          y: 1,
        });
      }
    } else {
      if (question.open_lower_bound) {
        graph.push({ x: -0.5 / (cdf.length - 1), y: pmf.at(0) ?? 0 });
      }
      pmf.slice(1, -1).forEach((value, index) => {
        graph.push({ x: (index + 0.5) / (cdf.length - 1), y: value });
      });
      if (question.open_upper_bound) {
        graph.push({
          x: (cdf.length - 0.5) / (cdf.length - 1),
          y: pmf.at(-1) ?? 0,
        });
      }
    }
  } else {
    if (graphType === "cdf") {
      cdf.forEach((value, index) => {
        graph.push({ x: (index - 0.5) / (cdf.length - 1), y: value });
      });
    } else {
      pmf.forEach((value, index) => {
        if (index === 0) {
          // add a point at the beginning to extend pmf to the edge
          graph.push({ x: -1e-10, y: pmf[1] ?? null });
          return;
        }
        if (index === pmf.length - 1) {
          // add a point at the end to extend pmf to the edge
          graph.push({ x: 1 + 1e-10, y: pmf[pmf.length - 2] ?? null });
          return;
        }
        graph.push({ x: (index - 0.5) / (pmf.length - 2), y: value });
      });
    }
  }

  if (type === "user_components") {
    return {
      graphLine: graph,
      verticalLines: [],
      color: CHART_COLOR_MAP[type],
      type,
      graphType,
    };
  }

  const verticalLines: Line = [];
  const quantiles = computeQuartilesFromCDF(cdf);
  if (question.type !== QuestionType.Discrete) {
    verticalLines.push(
      {
        x: quantiles.lower25,
        y: interpolateYValue(quantiles.lower25, graph),
      },
      {
        x: quantiles.median,
        y: interpolateYValue(quantiles.median, graph),
      },
      {
        x: quantiles.upper75,
        y: interpolateYValue(quantiles.upper75, graph),
      }
    );
  } else {
    // Discrete case uses a bar chart, so has to snap to y values
    verticalLines.push(
      {
        x: quantiles.lower25,
        y: getClosestYValue(quantiles.lower25, graph),
      },
      {
        x: quantiles.median,
        y: getClosestYValue(quantiles.median, graph),
      },
      {
        x: quantiles.upper75,
        y: getClosestYValue(quantiles.upper75, graph),
      }
    );
  }

  return {
    graphLine: graph,
    verticalLines,
    color: CHART_COLOR_MAP[type],
    type,
    graphType,
  };
}

export function getContinuousAreaChartData({
  question,
  isClosed,
}: {
  question: QuestionWithNumericForecasts;
  isClosed?: boolean;
}): ContinuousAreaGraphInput {
  const chartData: ContinuousAreaGraphInput = [];

  const latest =
    question.aggregations[question.default_aggregation_method]?.latest;

  if (latest && isForecastActive(latest)) {
    chartData.push({
      pmf: cdfToPmf(latest.forecast_values),
      cdf: latest.forecast_values,
      type: (isClosed ? "community_closed" : "community") as ContinuousAreaType,
    });
  }

  return chartData;
}

export default React.memo(MinifiedContinuousAreaChart);
