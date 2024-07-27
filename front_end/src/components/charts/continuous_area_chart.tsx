"use client";
import { log } from "console";
import { format, fromUnixTime } from "date-fns";
import { merge } from "lodash";
import React, { FC, useMemo } from "react";
import {
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryCursorContainer,
  VictoryLine,
  VictoryThemeDefinition,
} from "victory";
import { z } from "zod";

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
import { QuestionType } from "@/types/question";
import { interpolateYValue, scaleInternalLocation } from "@/utils/charts";
import { computeQuartilesFromCDF } from "@/utils/math";
import { abbreviatedNumber } from "@/utils/number_formatters";

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
  rangeMin: number;
  rangeMax: number;
  zeroPoint: number | null;
  data: ContinuousAreaGraphInput;
  graphType?: ContinuousAreaGraphType;
  questionType?: QuestionType;
  height?: number;
  extraTheme?: VictoryThemeDefinition;
  onCursorChange?: (value: ContinuousAreaHoverState | null) => void;
};

const ContinuousAreaChart: FC<Props> = ({
  rangeMin,
  rangeMax,
  zeroPoint,
  data,
  graphType = "pmf",
  questionType = QuestionType.Numeric,
  height = 150,
  extraTheme,
  onCursorChange,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const charts = useMemo(
    () =>
      data.reduce<NumericPredictionGraph[]>(
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
      ),
    [data, graphType]
  );
  const { xDomain, yDomain } = useMemo<{
    xDomain: Tuple<number>;
    yDomain: Tuple<number>;
  }>(
    () => ({
      xDomain: [0, 1],
      yDomain: [
        0,
        1.2 *
          Math.max(
            ...data
              .map((x) =>
                graphType === "cdf"
                  ? x.cdf.slice(1, x.pmf.length - 1)
                  : x.pmf.slice(1, x.pmf.length - 1)
              )
              .flat()
          ),
      ],
    }),
    [data, graphType]
  );
  const { ticks, tickFormat } = useMemo(
    () =>
      generateNumericAreaTicks(
        rangeMin,
        rangeMax,
        zeroPoint,
        questionType,
        chartWidth
      ),
    [rangeMin, rangeMax, zeroPoint, questionType, chartWidth]
  );

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
                      : getThemeColor(METAC_COLORS.olive["500"]),
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
                      : getThemeColor(METAC_COLORS.olive["700"]),
                  strokeDasharray: chart.color === "orange" ? "2,2" : undefined,
                },
              }}
            />
          ))}
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
                        : getThemeColor(METAC_COLORS.olive["700"]),
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
      y: graph[Math.min(198, Math.round(quantiles.lower25 * 200))]?.y ?? 0,
    },
    {
      x: quantiles.median,
      y: graph[Math.min(198, Math.round(quantiles.median * 200))]?.y ?? 0,
    },
    {
      x: quantiles.upper75,
      y: graph[Math.min(198, Math.round(quantiles.upper75 * 200))]?.y ?? 0,
    }
  );

  return {
    graphLine: graph,
    verticalLines,
    color: CHART_COLOR_MAP[type],
    type,
  };
}

function generateNumericAreaTicks(
  rangeMin: number,
  rangeMax: number,
  zeroPoint: number | null,
  questionType: QuestionType,
  chartWidth: number
) {
  const minPixelPerTick = 50;
  const maxMajorTicks = Math.floor(chartWidth / minPixelPerTick);
  const minorTicksPerMajor = 9;

  let majorTicks = Array.from(
    { length: maxMajorTicks + 1 },
    (_, i) => i / maxMajorTicks
  );
  const ticks = [];
  for (let i = 0; i < majorTicks.length - 1; i++) {
    ticks.push(majorTicks[i]);
    const minorStep =
      (majorTicks[i + 1] - majorTicks[i]) / (minorTicksPerMajor + 1);
    for (let j = 1; j <= minorTicksPerMajor; j++) {
      ticks.push(majorTicks[i] + minorStep * j);
    }
  }
  ticks.push(majorTicks[majorTicks.length - 1]);

  return {
    ticks,
    tickFormat: (x: number) => {
      if (majorTicks.includes(x)) {
        const scaled_location = scaleInternalLocation(
          x,
          rangeMin,
          rangeMax,
          zeroPoint
        );
        if (questionType === QuestionType.Date) {
          return format(fromUnixTime(scaled_location), "yyyy-MM");
        } else {
          return abbreviatedNumber(scaled_location);
        }
      }

      return "";
    },
  };
}

export default React.memo(ContinuousAreaChart);
