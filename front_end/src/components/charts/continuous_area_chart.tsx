"use client";
import { isNil, merge } from "lodash";
import React, { FC, useCallback, useEffect, useMemo, useState } from "react";
import {
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryCursorContainer,
  VictoryLine,
  VictoryScatter,
  VictoryThemeDefinition,
} from "victory";

import { getResolutionData } from "@/components/charts/numeric_chart";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import {
  ContinuousAreaGraphType,
  ContinuousAreaHoverState,
  ContinuousAreaType,
  Line,
} from "@/types/charts";
import { Resolution } from "@/types/post";
import { QuestionType, Scaling } from "@/types/question";
import {
  generateScale,
  getClosestYValue,
  interpolateYValue,
} from "@/utils/charts";
import { cdfToPmf, computeQuartilesFromCDF } from "@/utils/math";

import LineCursorPoints from "./primitives/line_cursor_points";

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
  scaling: Scaling;
  data: ContinuousAreaGraphInput;
  graphType?: ContinuousAreaGraphType;
  questionType?: QuestionType;
  height?: number;
  width?: number;
  extraTheme?: VictoryThemeDefinition;
  resolution: Resolution | null;
  onCursorChange?: (value: ContinuousAreaHoverState | null) => void;
  hideCP?: boolean;
  hideLabels?: boolean;
  unit?: string;
  shortLabels?: boolean;
};

const ContinuousAreaChart: FC<Props> = ({
  scaling,
  data,
  graphType = "pmf",
  questionType = QuestionType.Numeric,
  height = 150,
  width = undefined,
  extraTheme,
  resolution,
  onCursorChange,
  hideCP,
  hideLabels = false,
  unit,
  shortLabels = false,
}) => {
  const { ref: chartContainerRef, width: containerWidth } =
    useContainerSize<HTMLDivElement>();
  const chartWidth = width || containerWidth;
  const [cursorEdge, setCursorEdge] = useState<number | null>(null);
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const paddingTop = graphType === "cdf" ? TOP_PADDING : 0;

  const charts = useMemo(() => {
    const parsedData = hideCP
      ? [...data].filter((el) => el.type === "user")
      : data;

    const chartData: NumericPredictionGraph[] = [];
    for (const datum of parsedData) {
      const { pmf, cdf, componentCdfs } = datum;
      chartData.push(
        generateNumericAreaGraph({
          pmf,
          cdf,
          graphType,
          type: datum.type,
        })
      );
      if (componentCdfs) {
        for (const componentCdf of componentCdfs) {
          chartData.push(
            generateNumericAreaGraph({
              pmf: cdfToPmf(componentCdf),
              cdf: componentCdf,
              graphType,
              type: "user_components",
            })
          );
        }
      }
    }
    return chartData;
  }, [data, graphType, hideCP]);

  const { xDomain, yDomain } = useMemo<{
    xDomain: Tuple<number>;
    yDomain: Tuple<number>;
  }>(() => {
    if (graphType === "cdf") {
      return {
        xDomain: [0, 1],
        yDomain: [0, 1],
      };
    }

    const maxValue = Math.max(
      ...data.map((x) => x.pmf.slice(1, x.pmf.length - 1)).flat()
    );
    return {
      xDomain: [0, 1],
      yDomain: [0, 1.2 * (maxValue <= 0 ? 1 : maxValue)],
    };
  }, [data, graphType]);
  const xScale = useMemo(
    () =>
      generateScale({
        displayType: questionType,
        axisLength: chartWidth,
        direction: "horizontal",
        domain: xDomain,
        scaling: scaling,
        unit,
        shortLabels,
        adjustLabels: true,
      }),
    [chartWidth, questionType, scaling, unit, xDomain, shortLabels]
  );
  const yScale = useMemo(
    () =>
      generateScale({
        displayType: QuestionType.Binary,
        axisLength: height - BOTTOM_PADDING - paddingTop,
        direction: "vertical",
        domain: yDomain,
        adjustLabels: true,
      }),
    [height, yDomain, paddingTop]
  );

  const resolutionPoint =
    !isNil(resolution) && resolution !== ""
      ? getResolutionData({
          questionType,
          resolution,
          resolveTime: 1,
          scaling,
        })
      : null;

  // TODO: find a nice way to display the out of bounds weights as numbers
  // const massBelowBounds = dataset[0];
  // const massAboveBounds = dataset[dataset.length - 1];
  const leftPadding = useMemo(() => {
    if (graphType === "cdf") {
      const labels = yScale.ticks.map((tick) => yScale.tickFormat(tick));
      const longestLabelLength = Math.max(
        ...labels.map((label) => label.length)
      );
      const longestLabelWidth = longestLabelLength * 9;

      return HORIZONTAL_PADDING + longestLabelWidth;
    }

    return HORIZONTAL_PADDING;
  }, [graphType, yScale]);

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
      const chartLeft = bounds.left + leftPadding;
      const chartRight = bounds.right - HORIZONTAL_PADDING;

      // Used to handle cursor display when hovering chart edges
      if (
        (evt.clientX >= chartLeft - CURSOR_CHART_EXTENSION &&
          evt.clientX <= chartLeft) ||
        (evt.clientX <= chartRight + CURSOR_CHART_EXTENSION &&
          evt.clientX >= chartRight)
      ) {
        let normalizedX: number | undefined;

        if (evt.clientX < chartLeft) {
          normalizedX = 0;
        } else if (evt.clientX > chartRight) {
          normalizedX = graphType === "cdf" ? 0.9999 : 1;
        }
        if (normalizedX !== undefined) {
          setCursorEdge(normalizedX);
          normalizedX = Math.max(0, Math.min(1, normalizedX));
          const hoverState = charts.reduce<ContinuousAreaHoverState>(
            (acc, el) => {
              if (el.graphType === "pmf") {
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
              x: normalizedX > 0 ? 1 : 0,
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
    [charts, onCursorChange, chartContainerRef, leftPadding, graphType]
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
            }))}
          yDomain={yDomain}
          chartHeight={height}
          paddingTop={paddingTop}
          paddingBottom={BOTTOM_PADDING}
        />
      }
      onCursorChange={(props: { x: number } | null) => {
        if (!props) {
          onCursorChange?.(null);
          return;
        }

        const hoverState = charts.reduce<ContinuousAreaHoverState>(
          (acc, el) => {
            if (el.graphType === "pmf") {
              // if graph is a pmf, we need to find the closest y value
              acc.yData[el.type] = getClosestYValue(props?.x, el.graphLine);
              return acc;
            }
            // if graph is a cdf, we need to interpolate the y value
            acc.yData[el.type] = interpolateYValue(props?.x, el.graphLine);
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

  return (
    <div ref={chartContainerRef} className="h-full w-full" style={{ height }}>
      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={actualTheme}
          padding={{
            top: paddingTop,
            left: leftPadding,
            bottom: BOTTOM_PADDING,
            right: HORIZONTAL_PADDING,
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
            .map((chart, index) => (
              <VictoryArea
                key={`area-${index}`}
                data={chart.graphLine}
                style={{
                  data: {
                    fill: (() => {
                      switch (chart.color) {
                        case "orange":
                          return getThemeColor(
                            METAC_COLORS.orange[
                              chart.type === "user" ? "700" : "400"
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
              />
            ))}
          {charts.map((chart, index) => (
            <VictoryLine
              key={`line-${index}`}
              data={chart.graphLine}
              style={{
                data: {
                  stroke: (() => {
                    switch (chart.color) {
                      case "orange":
                        return getThemeColor(
                          METAC_COLORS.orange[
                            chart.type === "user"
                              ? "800"
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
                  strokeDasharray: chart.color === "orange" ? "2,2" : undefined,
                },
              }}
            />
          ))}
          {resolutionPoint && !isNil(resolutionPoint[0]) && (
            <VictoryScatter
              data={[
                {
                  x: resolutionPoint[0].y,
                  y: 0,
                  symbol: "diamond",
                  size: 4,
                },
              ]}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS.purple["800"]),
                  fill: "none",
                  strokeWidth: 2.5,
                },
              }}
            />
          )}
          {graphType === "cdf" && (
            <VictoryAxis
              dependentAxis
              style={{
                tickLabels: { padding: 2 },
                ticks: { strokeWidth: 1 },
              }}
              tickValues={yScale.ticks}
              tickFormat={yScale.tickFormat}
            />
          )}
          <VictoryAxis
            tickValues={xScale.ticks}
            tickFormat={hideLabels ? () => "" : xScale.tickFormat}
            style={{
              ticks: { strokeWidth: 1 },
              tickLabels: {
                textAnchor: ({ index, ticks }) =>
                  // We want first and last labels be aligned against area boundaries
                  index === 0
                    ? "start"
                    : index === ticks.length - 1
                      ? "end"
                      : "middle",
              },
            }}
          />

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
                          return getThemeColor(METAC_COLORS.orange["800"]);
                        case "gray":
                          return getThemeColor(METAC_COLORS.gray["500"]);
                        default:
                          return undefined;
                      }
                    })(),
                    strokeDasharray: "2,1",
                  },
                }}
              />
            ))
          )}
          {/* Manually render cursor component when cursor is on edge */}
          {!isNil(cursorEdge) && (
            <LineCursorPoints
              x={
                cursorEdge === 0
                  ? leftPadding + CURSOR_POINT_OFFSET
                  : chartWidth - CURSOR_POINT_OFFSET
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
              }))}
              chartHeight={height}
              yDomain={yDomain}
              paddingBottom={BOTTOM_PADDING}
              paddingTop={paddingTop}
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
}): NumericPredictionGraph {
  const { pmf, cdf, graphType, type } = data;

  const graph: Line = [];
  if (graphType === "cdf") {
    cdf.forEach((value, index) => {
      graph.push({ x: index / (cdf.length - 1), y: value });
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

  return {
    graphLine: graph,
    verticalLines,
    color: CHART_COLOR_MAP[type],
    type,
    graphType,
  };
}

export default React.memo(ContinuousAreaChart);
