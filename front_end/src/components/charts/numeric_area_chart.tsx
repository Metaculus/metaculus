"use client";
import { format, fromUnixTime } from "date-fns";
import { merge } from "lodash";
import React, { FC, useMemo } from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryThemeDefinition,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { Line } from "@/types/charts";
import { QuestionType } from "@/types/question";
import { computeQuartilesFromCDF } from "@/utils/math";

type NumericAreaColor = "orange" | "green";

type Props = {
  min: number;
  max: number;
  data: {
    pmf: number[];
    cdf: number[];
    color: NumericAreaColor;
  }[];
  type?: QuestionType;
  height?: number;
  extraTheme?: VictoryThemeDefinition;
};

const NumericAreaChart: FC<Props> = ({
  min,
  max,
  data,
  type = QuestionType.Numeric,
  height = 150,
  extraTheme,
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
          generateNumericAreaGraph({ pmf: el.pmf, cdf: el.cdf, min, max }),
        ],
        []
      ),
    [data, max, min]
  );
  const { ticks, tickFormat } = useMemo(
    () => generateNumericAreaTicks(min, max, type, chartWidth),
    [chartWidth, max, min, type]
  );

  // TODO: find a nice way to display the out of bounds weights as numbers
  // const massBelowBounds = dataset[0];
  // const massAboveBounds = dataset[dataset.length - 1];

  return (
    <div ref={chartContainerRef} className="h-full w-full" style={{ height }}>
      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={actualTheme}
          padding={{
            left: 10,
            bottom: 20,
            right: 10,
          }}
          domain={{
            x: [min, max],
            y: [0, 1.2 * Math.max(...data.map((x) => x.pmf).flat())],
          }}
        >
          {charts.map((chart, index) => (
            <VictoryArea
              key={`area-${index}`}
              data={chart.graphLine}
              style={{
                data: {
                  fill:
                    data[index].color === "orange"
                      ? getThemeColor(METAC_COLORS.orange["300"])
                      : getThemeColor(METAC_COLORS.green["200"]),
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
                    data[index].color === "orange"
                      ? getThemeColor(METAC_COLORS.orange["500"])
                      : getThemeColor(METAC_COLORS.green["500"]),
                  strokeDasharray:
                    data[index].color === "orange" ? "2,2" : undefined,
                },
              }}
            />
          ))}
          <VictoryAxis tickValues={ticks} tickFormat={tickFormat} />
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
                      data[k].color === "orange"
                        ? getThemeColor(METAC_COLORS.orange["500"])
                        : getThemeColor(METAC_COLORS.green["500"]),
                    strokeDasharray: "2,2",
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
};

function generateNumericAreaGraph(data: {
  pmf: number[];
  cdf: number[];
  min: number;
  max: number;
}): NumericPredictionGraph {
  const { min, max, pmf, cdf } = data;

  const graph: Line = [];
  pmf.forEach((value, index) => {
    if (index === 0 || index === pmf.length - 1) {
      // first and last bins are probabilty mass out of bounds
      return;
    }
    graph.push({ x: (index * (max - min)) / pmf.length, y: value });
  });

  const verticalLines: Line = [];
  const quantiles = computeQuartilesFromCDF(cdf);
  console.log(graph);
  verticalLines.push(
    {
      x: quantiles.lower25 * max,
      y: graph[Math.min(198, Math.round(quantiles.lower25 * 200))]?.y ?? 0,
    },
    {
      x: quantiles.median * max,
      y: graph[Math.min(198, Math.round(quantiles.median * 200))]?.y ?? 0,
    },
    {
      x: quantiles.upper75 * max,
      y: graph[Math.min(198, Math.round(quantiles.upper75 * 200))]?.y ?? 0,
    }
  );

  return {
    graphLine: graph,
    verticalLines,
  };
}

// @TODO Luke can you fix the ticks
function generateNumericAreaTicks(
  min: number,
  max: number,
  type: QuestionType,
  chartWidth: number
) {
  const minPixelPerTick = 50;
  const maxMajorTicks = Math.floor(chartWidth / minPixelPerTick);
  const minorTicksPerMajor = 9;

  const range = max - min;
  const majorStep = range / maxMajorTicks;

  let majorTicks = Array.from(
    { length: maxMajorTicks + 1 },
    (_, i) => min + i * majorStep
  );
  majorTicks = majorTicks.map((x) => Number(x.toFixed(0)));

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
        switch (type) {
          case QuestionType.Date:
            return format(fromUnixTime(x), "MMM d");
          default:
            return x.toString();
        }
      }

      return "";
    },
  };
}

export default React.memo(NumericAreaChart);
