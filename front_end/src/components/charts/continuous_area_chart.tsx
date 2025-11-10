"use client";
import { isNil, merge } from "lodash";
import { useLocale } from "next-intl";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryContainer,
  VictoryCursorContainer,
  VictoryLabel,
  VictoryLine,
  VictoryPortal,
  VictoryScatter,
  VictoryThemeDefinition,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import {
  ContinuousAreaGraphType,
  ContinuousAreaHoverState,
  ContinuousAreaType,
  Line,
  ScaleDirection,
} from "@/types/charts";
import {
  GraphingQuestionProps,
  Question,
  QuestionType,
  QuestionWithForecasts,
  Scaling,
} from "@/types/question";
import { generateScale } from "@/utils/charts/axis";
import {
  getClosestXValue,
  getClosestYValue,
  interpolateYValue,
} from "@/utils/charts/helpers";
import { getResolutionPoint } from "@/utils/charts/resolution";
import { isForecastActive } from "@/utils/forecasts/helpers";
import { formatResolution } from "@/utils/formatters/resolution";
import {
  cdfToPmf,
  computeQuartilesFromCDF,
  rescaleCdf,
  unscaleNominalLocation,
} from "@/utils/math";

import ChartValueBox from "./primitives/chart_value_box";
import LineCursorPoints from "./primitives/line_cursor_points";
import ResolutionDiamond from "./primitives/resolution_diamond";

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

const TOP_PADDING = 10;
const BOTTOM_PADDING = 20;
const HORIZONTAL_PADDING = 10;
const CURSOR_POINT_OFFSET = 5;
const CURSOR_CHART_EXTENSION = 10;

type Props = {
  question: Question | GraphingQuestionProps;
  data: ContinuousAreaGraphInput;
  graphType?: ContinuousAreaGraphType;
  height?: number;
  width?: number;
  extraTheme?: VictoryThemeDefinition;
  onCursorChange?: (value: ContinuousAreaHoverState | null) => void;
  hideCP?: boolean;
  hideLabels?: boolean;
  shortLabels?: boolean;
  alignChartTabs?: boolean;
  forceTickCount?: number; // is used on feed page
  withResolutionChip?: boolean;
  withTodayLine?: boolean;
  globalScaling?: Scaling;
  outlineUser?: boolean;
};

const ContinuousAreaChart: FC<Props> = ({
  question,
  data,
  graphType = "pmf",
  height = 150,
  width = undefined,
  extraTheme,
  onCursorChange,
  hideCP,
  hideLabels = false,
  shortLabels = false,
  alignChartTabs,
  forceTickCount,
  withResolutionChip = true,
  withTodayLine = true,
  globalScaling,
  outlineUser = false,
}) => {
  const locale = useLocale();
  const { ref: chartContainerRef, width: containerWidth } =
    useContainerSize<HTMLDivElement>();
  const chartWidth = width || containerWidth;
  const [cursorEdge, setCursorEdge] = useState<number | null>(null);
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const discrete = question.type === QuestionType.Discrete;
  const paddingTop = graphType === "cdf" || discrete ? TOP_PADDING : 0;

  const charts = useMemo(() => {
    const parsedData = hideCP
      ? [...data].filter((el) => el.type === "user")
      : data;

    const chartData: NumericPredictionGraph[] = [];
    for (const datum of parsedData) {
      const { pmf, cdf, componentCdfs } = datum;
      const useRescaled = globalScaling && !isNil(question.scaling.zero_point);
      const scaled = useRescaled
        ? (() => {
            const cdfRescaled = rescaleCdf(cdf, question.scaling, {
              ...question.scaling,
              zero_point: globalScaling.zero_point,
            });
            return { cdf: cdfRescaled, pmf: cdfToPmf(cdfRescaled) };
          })()
        : { cdf, pmf };

      chartData.push(
        generateNumericAreaGraph({
          ...scaled,
          graphType,
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
              graphType,
              type: "user_components",
              question,
            })
          );
        }
      }
    }
    return chartData;
  }, [data, graphType, hideCP, question, globalScaling]);

  const { xDomain, yDomain } = useMemo<{
    xDomain: Tuple<number>;
    yDomain: Tuple<number>;
  }>(() => {
    if (question.type !== QuestionType.Discrete) {
      const xDomain: Tuple<number> =
        globalScaling &&
        !isNil(globalScaling.range_min) &&
        !isNil(globalScaling.range_max)
          ? [
              unscaleNominalLocation(globalScaling.range_min, {
                ...question.scaling,
                zero_point: globalScaling.zero_point,
              }),
              unscaleNominalLocation(globalScaling.range_max, {
                ...question.scaling,
                zero_point: globalScaling.zero_point,
              }),
            ]
          : [0, 1];
      if (graphType === "cdf") {
        return {
          xDomain,
          yDomain: [0, 1],
        };
      }

      const maxValue = Math.max(
        ...data.map((x) => x.pmf.slice(1, x.pmf.length - 1)).flat()
      );
      return {
        xDomain,
        yDomain: [0, 1.2 * (maxValue <= 0 ? 1 : maxValue)],
      };
    }
    let xMin = Math.min(
      ...charts.map((chart) => 2 * (chart.graphLine.at(0)?.x ?? 0)),
      0
    );
    let xMax = Math.max(
      ...charts.map((chart) => 1 + 2 * ((chart.graphLine.at(-1)?.x ?? 1) - 1)),
      1
    );

    const N =
      question.inbound_outcome_count ??
      Math.max(1, (data.at(0)?.cdf?.length ?? 1) - 1);
    if (Number.isFinite(N) && N > 0) {
      const halfBin = 0.5 / N;
      if (question.resolution === "below_lower_bound")
        xMin = Math.min(xMin, -halfBin);
      if (question.resolution === "above_upper_bound")
        xMax = Math.max(xMax, 1 + halfBin);
    }
    const xDomain: Tuple<number> = [xMin, xMax];
    if (graphType === "cdf") return { xDomain, yDomain: [0, 1] };

    const maxValue = Math.max(...data.map((x) => x.pmf).flat());
    return {
      xDomain,
      yDomain: [0, Math.min(1, 1.2 * (maxValue <= 0 ? 1 : maxValue))],
    };
  }, [
    data,
    charts,
    graphType,
    question.type,
    question.resolution,
    globalScaling,
    question.inbound_outcome_count,
    question.scaling,
  ]);

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
        alwaysShowTicks: !isNil(forceTickCount),
      }),
    [chartWidth, question, xDomain, shortLabels, forceTickCount]
  );
  const yScale = useMemo(
    () =>
      generateScale({
        displayType: QuestionType.Binary,
        axisLength: height - BOTTOM_PADDING - paddingTop,
        direction: ScaleDirection.Vertical,
        domain: yDomain,
        zoomedDomain: yDomain,
        adjustLabels: true,
      }),
    [height, yDomain, paddingTop]
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

  const toDiscreteBarCenter = useCallback(
    (norm: number): number => {
      const N =
        question.inbound_outcome_count ??
        Math.max(1, (data.at(0)?.cdf?.length ?? 1) - 1);
      if (!Number.isFinite(norm) || N <= 0) return norm;
      if (norm <= 0 || norm >= 1) return norm;
      const idx = Math.round(norm * (N - 1));
      return (idx + 0.5) / N;
    },
    [question.inbound_outcome_count, data]
  );

  const resX = useMemo(() => {
    if (!resolutionPoint || !Number.isFinite(resolutionPoint.y as number)) {
      return null;
    }
    return question.type === QuestionType.Discrete
      ? toDiscreteBarCenter(resolutionPoint.y as number)
      : (resolutionPoint.y as number);
  }, [resolutionPoint, question.type, toDiscreteBarCenter]);

  const forcedOobSide: "left" | "right" | null = useMemo(() => {
    if (question.resolution === "below_lower_bound") return "left";
    if (question.resolution === "above_upper_bound") return "right";
    return null;
  }, [question.resolution]);

  const resPlacement = useMemo<"in" | "left" | "right" | null>(() => {
    if (resX == null || !Number.isFinite(resX)) return null;
    if (forcedOobSide) return forcedOobSide;

    const baseMin = 0;
    const baseMax = 1;
    const EPS = 1e-9;

    if (resX < baseMin - EPS) return "left";
    if (resX > baseMax + EPS) return "right";
    return "in";
  }, [resX, forcedOobSide]);

  const formattedResolution = formatResolution({
    resolution: question.resolution,
    questionType: question.type,
    locale,
    scaling: question.scaling,
    actual_resolve_time: null,
  });
  // TODO: find a nice way to display the out of bounds weights as numbers
  // const massBelowBounds = dataset[0];
  // const massAboveBounds = dataset[dataset.length - 1];
  const horizontalPadding = useMemo(() => {
    if (
      alignChartTabs ||
      graphType === "cdf" ||
      question.type === QuestionType.Discrete
    ) {
      const labels = yScale.ticks.map((tick) => yScale.tickFormat(tick));
      const longestLabelLength = Math.max(
        ...labels.map((label) => label.length)
      );
      const longestLabelWidth = Math.max(5, longestLabelLength) * 5;

      return HORIZONTAL_PADDING + longestLabelWidth;
    }

    return HORIZONTAL_PADDING;
  }, [graphType, yScale, question.type, alignChartTabs]);

  const handleMouseLeave = useCallback(() => {
    onCursorChange?.(null);
    setCursorEdge(null);
  }, [onCursorChange]);

  const handleMouseMove = useCallback(
    (evt: MouseEvent) => {
      const svg = chartContainerRef.current?.firstChild as SVGElement;
      if (!svg) return;
      setCursorEdge(null);
      const bounds = svg.getBoundingClientRect();
      const chartLeft = bounds.left + horizontalPadding;
      const chartRight = bounds.right - horizontalPadding;

      // Used to handle cursor display when hovering chart edges
      if (
        (evt.clientX >= chartLeft - CURSOR_CHART_EXTENSION &&
          evt.clientX <= chartLeft) ||
        (evt.clientX <= chartRight + CURSOR_CHART_EXTENSION &&
          evt.clientX >= chartRight)
      ) {
        const firstBucketLocation =
          question.type !== QuestionType.Discrete
            ? 0
            : (question.open_lower_bound ? -0.5 : 0.5) /
              ((data.at(0)?.pmf.length || 200) - 2);
        const lastBucketLocation =
          question.type !== QuestionType.Discrete
            ? 1
            : 1 +
              (question.open_upper_bound ? 0.5 : -0.5) /
                ((data.at(0)?.pmf.length || 200) - 2);

        let normalizedX: number | undefined;
        if (evt.clientX < chartLeft) {
          normalizedX = firstBucketLocation;
        } else if (evt.clientX > chartRight) {
          normalizedX = lastBucketLocation;
        }
        if (normalizedX !== undefined) {
          setCursorEdge(normalizedX);
          const hoverState = charts.reduce<ContinuousAreaHoverState>(
            (acc, el) => {
              if (
                el.graphType === "pmf" ||
                question.type === QuestionType.Discrete
              ) {
                acc.yData[el.type] = getClosestYValue(
                  normalizedX as number,
                  el.graphLine
                );
                return acc;
              }

              acc.yData[el.type] = interpolateYValue(
                normalizedX as number,
                el.graphLine
              );
              return acc;
            },
            {
              x: normalizedX,
              yData: {
                community: 0,
                user: 0,
                user_previous: 0,
                community_closed: 0,
                user_components: 0,
              },
            }
          );
          onCursorChange?.(hoverState);
        }
      }
    },
    [
      charts,
      onCursorChange,
      chartContainerRef,
      horizontalPadding,
      data,
      question,
    ]
  );
  useEffect(() => {
    const svg = chartContainerRef.current?.firstChild as SVGElement;
    if (!svg) return;

    svg.addEventListener("mousemove", handleMouseMove);
    svg.addEventListener("mouseleave", handleMouseLeave);

    return () => {
      svg.removeEventListener("mousemove", handleMouseMove);
      svg.removeEventListener("mouseleave", handleMouseLeave);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [chartContainerRef.current, handleMouseMove, handleMouseLeave]);

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
  const CursorContainer = (
    <VictoryCursorContainer
      cursorLabel={"label"}
      style={{
        strokeWidth: 0,
        touchAction: "pan-y",
      }}
      cursorLabelComponent={
        <LineCursorPoints
          chartData={charts
            .filter((chart) => chart.type !== "user_components")
            .map((chart) => ({
              line: chart.graphLine,
              color: (() => {
                switch (chart.color) {
                  case "orange":
                    return getThemeColor(
                      METAC_COLORS.orange[chart.type === "user" ? "800" : "500"]
                    );
                  case "gray":
                    return getThemeColor(METAC_COLORS.gray["500"]);
                  default:
                    return getThemeColor(METAC_COLORS.olive["700"]);
                }
              })(),
              type: chart.type,
              graphType: chart.graphType,
            }))}
          yDomain={yDomain}
          xDomain={xDomain}
          chartWidth={chartWidth}
          chartHeight={height}
          barWidth={barWidth}
          paddingTop={paddingTop}
          paddingBottom={BOTTOM_PADDING}
          paddingLeft={horizontalPadding}
          paddingRight={horizontalPadding}
          discrete={discrete}
        />
      }
      onCursorChange={(props: { x: number } | null) => {
        if (!props) {
          onCursorChange?.(null);
          return;
        }

        const hoverState = charts.reduce<ContinuousAreaHoverState>(
          (acc, el) => {
            if (!discrete) {
              if (el.graphType === "pmf") {
                acc.yData[el.type] = getClosestYValue(props?.x, el.graphLine);
              } else {
                acc.yData[el.type] = interpolateYValue(props?.x, el.graphLine);
              }
            } else {
              acc.yData[el.type] = getClosestYValue(props?.x, el.graphLine);
              acc.x = getClosestXValue(props?.x, el.graphLine);
            }
            return acc;
          },
          {
            x: props.x,
            yData: {
              community: 0,
              user: 0,
              user_previous: 0,
              community_closed: 0,
              user_components: 0,
            },
          }
        );

        onCursorChange?.(hoverState);
      }}
    />
  );
  const todayLabelPosition = useMemo(() => {
    const visibleChartLength = chartWidth - 2 * horizontalPadding;
    const point = {
      x:
        horizontalPadding +
        ((chartWidth - 2 * horizontalPadding) *
          (unscaleNominalLocation(
            Math.floor(Date.now() / 1000),
            question.scaling
          ) -
            xDomain[0])) /
          (xDomain[1] - xDomain[0]),
      y: 0,
    };
    if (point.x < 0 || point.x > visibleChartLength) {
      return null;
    }
    return point;
  }, [chartWidth, horizontalPadding, question.scaling, xDomain]);

  return (
    <div ref={chartContainerRef} className="h-full w-full" style={{ height }}>
      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={actualTheme}
          padding={{
            top: paddingTop,
            left: horizontalPadding,
            bottom: BOTTOM_PADDING,
            right: horizontalPadding,
          }}
          domain={{ x: xDomain, y: yDomain }}
          containerComponent={
            onCursorChange ? (
              CursorContainer
            ) : (
              <VictoryContainer
                style={{
                  pointerEvents: "auto",
                  userSelect: "auto",
                  touchAction: "auto",
                }}
              />
            )
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
                        opacity:
                          outlineUser && chart.type === "user"
                            ? 0
                            : chart.type === "user_previous"
                              ? 0.1
                              : 0.3,
                      },
                    }}
                  />
                );
              }
              return (
                <VictoryBar
                  key={`bar-${index}`}
                  data={chart.graphLine}
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
          {!discrete
            ? charts.map((chart, index) => (
                <VictoryLine
                  key={`line-${index}`}
                  data={chart.graphLine}
                  style={{
                    data: {
                      stroke: (() => {
                        if (extraTheme?.line?.style?.data?.stroke) {
                          return extraTheme?.line?.style?.data?.stroke;
                        }
                        switch (chart.color) {
                          case "orange":
                            return getThemeColor(
                              METAC_COLORS.orange[
                                chart.type === "user"
                                  ? "500"
                                  : chart.type === "user_components"
                                    ? "500"
                                    : "200"
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
                      strokeDasharray:
                        chart.type === "user_previous" ? "2,2" : undefined,
                    },
                  }}
                />
              ))
            : null}
          {(graphType === "cdf" || question.type === QuestionType.Discrete) && (
            // Prevent Y axis being cut off in edge cases
            <VictoryPortal>
              <VictoryAxis
                dependentAxis
                style={{
                  tickLabels: {
                    padding: 2,
                    fill: getThemeColor(METAC_COLORS.gray["700"]),
                  },
                  ticks: { stroke: "transparent" },
                  axis: {
                    stroke: getThemeColor(METAC_COLORS.gray["300"]),
                    strokeWidth: 1,
                  },
                }}
                tickValues={yScale.ticks}
                tickFormat={yScale.tickFormat}
                axisValue={xDomain[0]}
              />
            </VictoryPortal>
          )}
          <VictoryAxis
            tickValues={xScale.ticks}
            tickFormat={hideLabels || hideCP ? () => "" : xScale.tickFormat}
            style={{
              ticks: {
                strokeWidth: 1,
                stroke: "transparent",
              },
              axis: {
                strokeWidth: 0,
              },
              tickLabels: {
                fontSize: 10,
                fill: getThemeColor(METAC_COLORS.gray["700"]),
                textAnchor: ({ index, ticks }) =>
                  // We want first and last labels be aligned against area boundaries
                  // except for discrete questions, whose first and last ticks are not
                  // at the edges of the chart
                  index === 0 && question.type !== QuestionType.Discrete
                    ? "start"
                    : index === ticks.length - 1 &&
                        question.type !== QuestionType.Discrete
                      ? "end"
                      : "middle",
              },
            }}
          />
          {/* Horizontal line */}
          {charts.map((chart, index) => (
            <VictoryLine
              key={`line-${index}`}
              data={[
                { x: 0, y: 0 },
                { x: 1, y: 0 },
              ]}
              style={{
                data: {
                  stroke: (() => {
                    switch (chart.color) {
                      case "orange":
                        return getThemeColor(METAC_COLORS.orange["800"]);
                      case "gray":
                        return getThemeColor(METAC_COLORS.gray["500"]);
                      default:
                        return undefined;
                    }
                  })(),
                },
              }}
            />
          ))}
          {/* Left/Right borders at bounds if requested */}
          {(question.scaling.range_min ?? 1) <=
            (globalScaling?.range_min ?? 0) && (
            <VictoryLine
              data={[
                { x: 0, y: yDomain[0] },
                { x: 0, y: yDomain[1] * 0.9 },
              ]}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS.gray["500"]),
                  strokeWidth: 0.5,
                },
              }}
            />
          )}
          {(question.scaling.range_max ?? 0) >=
            (globalScaling?.range_max ?? 1) && (
            <VictoryLine
              data={[
                { x: 1, y: yDomain[0] },
                { x: 1, y: yDomain[1] * 0.9 },
              ]}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS.gray["500"]),
                  strokeWidth: 0.5,
                },
              }}
            />
          )}
          {charts.map((chart, k) =>
            chart.verticalLines.map((line, index) => (
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
                        case "orange":
                          return getThemeColor(METAC_COLORS.orange["700"]);
                        case "gray":
                          return getThemeColor(METAC_COLORS.gray["500"]);
                        default:
                          return undefined;
                      }
                    })(),
                    strokeDasharray: "2,2",
                  },
                }}
              />
            ))
          )}
          {/* Resolution point */}
          {resX != null && resPlacement === "in" && (
            <VictoryScatter
              data={[
                {
                  x: resX,
                  y: 0,
                  symbol: "diamond",
                  size: 4,
                },
              ]}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS.purple["800"]),
                  fill: getThemeColor(METAC_COLORS.gray["200"]),
                  strokeWidth: 2.5,
                },
              }}
            />
          )}
          {/* Resolution chip */}
          {resX != null &&
            resPlacement === "in" &&
            withResolutionChip &&
            (question.type === QuestionType.Discrete ||
              question.type === QuestionType.Numeric) && (
              <VictoryScatter
                data={[
                  {
                    x: resX,
                    y: 0,
                    symbol: "diamond",
                    size: 4,
                  },
                ]}
                dataComponent={
                  <VictoryPortal>
                    <ChartValueBox
                      rightPadding={0}
                      chartWidth={chartWidth}
                      isCursorActive={false}
                      isDistributionChip
                      colorOverride={METAC_COLORS.purple["800"]}
                      resolution={formattedResolution}
                    />
                  </VictoryPortal>
                }
              />
            )}

          {resX != null && resPlacement && resPlacement !== "in" && (
            <VictoryPortal>
              <VictoryScatter
                data={[
                  {
                    x:
                      resPlacement === "left"
                        ? Math.min(...xDomain)
                        : Math.max(...xDomain),
                    y: yDomain[1] - (yDomain[1] - yDomain[0]) * 0.04,
                    placement: resPlacement === "left" ? "above" : "below",
                    primary: METAC_COLORS.purple["800"],
                    secondary: METAC_COLORS.purple["500"],
                  },
                ]}
                dataComponent={
                  <ResolutionDiamond
                    hoverable={false}
                    axisPadPx={3}
                    rotateDeg={resPlacement === "left" ? 90 : -90}
                    refProps={{}}
                  />
                }
              />
            </VictoryPortal>
          )}
          {/* Today's date dot for date questions */}
          {question.type === QuestionType.Date && withTodayLine && (
            <VictoryScatter
              data={[
                {
                  x: unscaleNominalLocation(
                    Math.floor(Date.now() / 1000),
                    question.scaling
                  ),
                  y: yDomain[0], // Bottom of the chart
                  symbol: "circle",
                  size: 3,
                },
              ]}
              style={{
                data: {
                  fill: getThemeColor(METAC_COLORS.blue["700"]),
                  stroke: "none",
                },
              }}
            />
          )}

          {question.type === QuestionType.Date &&
            todayLabelPosition &&
            withTodayLine && (
              <VictoryPortal>
                <VictoryLabel
                  x={todayLabelPosition.x}
                  y={height - BOTTOM_PADDING - 12} // Position above the dot
                  text="Today"
                  style={{
                    fill: getThemeColor(METAC_COLORS.blue["700"]),
                    fontSize: 12,
                  }}
                  textAnchor="middle"
                />
              </VictoryPortal>
            )}

          {/* Manually render cursor component when cursor is on edge */}
          {!isNil(cursorEdge) && (
            <LineCursorPoints
              chartWidth={chartWidth}
              x={
                cursorEdge < 0.5
                  ? horizontalPadding + CURSOR_POINT_OFFSET
                  : chartWidth - horizontalPadding + CURSOR_POINT_OFFSET
              }
              datum={{
                x: cursorEdge,
                y: 0,
              }}
              chartData={charts.map((chart) => ({
                line: chart.graphLine,
                color: getThemeColor(
                  chart.color === "orange"
                    ? METAC_COLORS.orange[chart.type === "user" ? "800" : "500"]
                    : METAC_COLORS.olive["700"]
                ),
                type: chart.type,
                graphType: chart.graphType,
              }))}
              chartHeight={height}
              yDomain={yDomain}
              xDomain={xDomain}
              paddingBottom={BOTTOM_PADDING}
              paddingTop={paddingTop}
              paddingLeft={horizontalPadding}
              paddingRight={horizontalPadding}
              discrete={discrete}
              barWidth={barWidth}
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
  userForecastOverride,
  isClosed,
}: {
  question: QuestionWithForecasts;
  userForecastOverride?: {
    cdf: number[];
    pmf: number[];
  };
  isClosed?: boolean;
}): ContinuousAreaGraphInput {
  const chartData: ContinuousAreaGraphInput = [];

  const latest =
    question.aggregations[question.default_aggregation_method].latest;
  const userForecast = question.my_forecasts?.latest;

  if (latest && isForecastActive(latest)) {
    chartData.push({
      pmf: cdfToPmf(latest.forecast_values),
      cdf: latest.forecast_values,
      type: (isClosed ? "community_closed" : "community") as ContinuousAreaType,
    });
  }

  if (userForecastOverride) {
    chartData.push({
      pmf: userForecastOverride.pmf,
      cdf: userForecastOverride.cdf,
      type: "user" as ContinuousAreaType,
    });
  } else if (!!userForecast && isForecastActive(userForecast)) {
    chartData.push({
      pmf: cdfToPmf(userForecast.forecast_values),
      cdf: userForecast.forecast_values,
      type: "user" as ContinuousAreaType,
    });
  }

  return chartData;
}

export default React.memo(ContinuousAreaChart);
