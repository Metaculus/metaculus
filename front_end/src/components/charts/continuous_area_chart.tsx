"use client";
import { merge } from "lodash";
import React, { FC, useMemo } from "react";
import {
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryCursorContainer,
  VictoryScatter,
  VictoryLine,
  VictoryThemeDefinition,
} from "victory";

import { getResolutionData } from "@/components/charts/numeric_chart";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import {
  ContinuousAreaGraphType,
  Line,
  ContinuousAreaHoverState,
  ContinuousAreaType,
} from "@/types/charts";
import { Resolution } from "@/types/post";
import { QuestionType, Scaling } from "@/types/question";
import { interpolateYValue, generateScale } from "@/utils/charts";
import { computeQuartilesFromCDF } from "@/utils/math";

import LineCursorPoints from "./primitives/line_cursor_points";

type ContinuousAreaColor = "orange" | "green";
const CHART_COLOR_MAP: Record<ContinuousAreaType, ContinuousAreaColor> = {
  community: "green",
  user: "orange",
};

export type ContinuousAreaGraphInput = Array<{
  pmf: number[];
  cdf: number[];
  type: ContinuousAreaType;
}>;

const BOTTOM_PADDING = 20;
const HORIZONTAL_PADDING = 10;

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
}) => {
  const { ref: chartContainerRef, width: containerWidth } =
    useContainerSize<HTMLDivElement>();
  const chartWidth = width || containerWidth;

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const charts = useMemo(() => {
    const parsedData = hideCP
      ? [...data].filter((el) => el.type === "user")
      : data;

    return parsedData.reduce<NumericPredictionGraph[]>(
      (acc, el) => [
        ...acc,
        generateNumericAreaGraph({
          pmf: el.pmf,
          cdf: el.cdf,
          graphType,
          type: el.type,
        }),
      ],
      []
    );
  }, [data, graphType, hideCP]);
  const { xDomain, yDomain } = useMemo<{
    xDomain: Tuple<number>;
    yDomain: Tuple<number>;
  }>(() => {
    const maxValue = Math.max(
      ...data
        .map((x) =>
          graphType === "cdf"
            ? x.cdf.slice(1, x.pmf.length - 1)
            : x.pmf.slice(1, x.pmf.length - 1)
        )
        .flat()
    );
    return {
      xDomain: [0, 1],
      yDomain: [0, 1.2 * (maxValue <= 0 ? 1 : maxValue)],
    };
  }, [data, graphType]);
  const { ticks, tickFormat } = useMemo(
    () =>
      generateScale({
        displayType: questionType,
        axisLength: chartWidth,
        direction: "horizontal",
        domain: xDomain,
        scaling: scaling,
      }),
    [chartWidth, questionType, scaling, xDomain]
  );

  const resolutionPoint = resolution
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

  const CursorContainer = (
    <VictoryCursorContainer
      cursorLabel={"label"}
      style={{
        strokeWidth: 0,
      }}
      cursorLabelComponent={
        <LineCursorPoints
          chartData={charts.map((chart) => ({
            line: chart.graphLine,
            color: getThemeColor(
              chart.color === "orange"
                ? METAC_COLORS.orange["800"]
                : METAC_COLORS.olive["700"]
            ),
            type: chart.type,
          }))}
          yDomain={yDomain}
          chartHeight={height - BOTTOM_PADDING}
        />
      }
      onCursorChange={(props: { x: number } | null) => {
        if (!props) {
          onCursorChange?.(null);
          return;
        }

        const hoverState = charts.reduce<ContinuousAreaHoverState>(
          (acc, el) => {
            acc.yData[el.type] = interpolateYValue(props?.x, el.graphLine);
            return acc;
          },
          {
            x: props.x,
            yData: {
              community: 0,
              user: 0,
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
            left: HORIZONTAL_PADDING,
            bottom: BOTTOM_PADDING,
            right: HORIZONTAL_PADDING,
          }}
          domain={{ x: xDomain, y: yDomain }}
          containerComponent={onCursorChange ? CursorContainer : undefined}
        >
          {charts.map((chart, index) => (
            <VictoryArea
              key={`area-${index}`}
              data={chart.graphLine}
              style={{
                data: {
                  fill:
                    chart.color === "orange"
                      ? getThemeColor(METAC_COLORS.orange["700"])
                      : undefined,
                  opacity: 0.3,
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
                  stroke:
                    chart.color === "orange"
                      ? getThemeColor(METAC_COLORS.orange["800"])
                      : undefined,
                  strokeDasharray: chart.color === "orange" ? "2,2" : undefined,
                },
              }}
            />
          ))}
          {resolutionPoint && (
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
          <VictoryAxis
            tickValues={ticks}
            tickFormat={tickFormat}
            style={{ ticks: { strokeWidth: 1 } }}
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
                    stroke:
                      chart.color === "orange"
                        ? getThemeColor(METAC_COLORS.orange["800"])
                        : undefined,
                    strokeDasharray: "2,1",
                  },
                }}
              />
            ))
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
      if (index === 0 || index === pmf.length - 1) {
        // first and last bins are probabilty mass out of bounds
        return;
      }
      graph.push({ x: (index - 0.5) / (pmf.length - 2), y: value });
    });
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
  };
}

export default React.memo(ContinuousAreaChart);
