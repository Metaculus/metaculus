"use client";
import { isNil, merge } from "lodash";
import React, { FC, useMemo, useState } from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLine,
  VictoryScatter,
  VictoryThemeDefinition,
  VictoryVoronoiContainer,
} from "victory";

import ChartFanTooltip from "@/components/charts/primitives/chart_fan_tooltip";
import FanPoint from "@/components/charts/primitives/fan_point";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { Area, FanOption, Line } from "@/types/charts";
import { Quartiles } from "@/types/question";

const TOOLTIP_WIDTH = 150;

type Props = {
  options: FanOption[];
  height?: number;
  yLabel?: string;
  withTooltip?: boolean;
  extraTheme?: VictoryThemeDefinition;
  pointSize?: number;
};

const FanChart: FC<Props> = ({
  options,
  height = 150,
  yLabel,
  withTooltip = false,
  extraTheme,
  pointSize,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;

  const [activePoint, setActivePoint] = useState<string | null>(null);

  const { line, area, points } = useMemo(
    () => buildChartData(options),
    [options]
  );
  const labels = adjustLabelsForDisplay(options, chartWidth, actualTheme);

  const tooltipItems = useMemo(
    () =>
      options.reduce<Record<string, Quartiles>>(
        (acc, el) => ({ ...acc, [el.name]: el.quartiles }),
        {}
      ),
    [options]
  );

  const shouldDisplayChart = !!chartWidth;
  return (
    <div ref={chartContainerRef} className="w-full" style={{ height }}>
      {shouldDisplayChart && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={actualTheme}
          domain={{
            y: [0, 1],
          }}
          domainPadding={{
            x: TOOLTIP_WIDTH / 2,
          }}
          containerComponent={
            withTooltip ? (
              <VictoryVoronoiContainer
                voronoiBlacklist={["fanArea", "fanLine"]}
                labels={({ datum }) => datum.x}
                labelComponent={
                  <ChartFanTooltip
                    chartHeight={height}
                    items={tooltipItems}
                    width={TOOLTIP_WIDTH}
                  />
                }
                onActivated={(points) => {
                  const x = points[0]?.x;
                  if (!isNil(x)) {
                    setActivePoint(x);
                  }
                }}
              />
            ) : undefined
          }
          events={[
            {
              target: "parent",
              eventHandlers: {
                onMouseOutCapture: () => {
                  setActivePoint(null);
                },
              },
            },
          ]}
        >
          <VictoryArea
            name="fanArea"
            data={area}
            style={{
              data: {
                fill: getThemeColor(METAC_COLORS.olive["500"]),
                opacity: 0.3,
              },
            }}
          />
          <VictoryLine
            name="fanLine"
            data={line}
            style={{
              data: {
                stroke: getThemeColor(METAC_COLORS.olive["700"]),
              },
            }}
          />
          <VictoryAxis dependentAxis label={yLabel} />
          <VictoryAxis tickFormat={(_, index) => labels[index]} />
          <VictoryScatter
            data={points.map((point) => ({
              ...point,
              symbol: point.resolved ? "diamond" : "square",
            }))}
            style={{
              data: {
                fill: ({ datum }) =>
                  datum.resolved
                    ? "none"
                    : getThemeColor(METAC_COLORS.olive["800"]),
                stroke: ({ datum }) =>
                  datum.resolved
                    ? getThemeColor(METAC_COLORS.purple["800"])
                    : getThemeColor(METAC_COLORS.olive["800"]),
                strokeWidth: ({ datum }) => (datum.resolved ? 2 : 6),
                strokeOpacity: ({ datum }) =>
                  datum.resolved ? 1 : activePoint === datum.x ? 0.3 : 0,
              },
            }}
            dataComponent={
              <FanPoint activePoint={activePoint} pointSize={pointSize} />
            }
          />
        </VictoryChart>
      )}
    </div>
  );
};

function buildChartData(options: FanOption[]) {
  const line: Line<string> = [];
  const area: Area<string> = [];
  const points: Array<{ x: string; y: number; resolved: boolean }> = [];

  for (const option of options) {
    line.push({
      x: option.name,
      y: option.quartiles.median,
    });
    area.push({
      x: option.name,
      y0: option.quartiles.lower25,
      y: option.quartiles.upper75,
    });
    points.push({
      x: option.name,
      y: option.quartiles.median,
      resolved: option.resolved,
    });
  }

  return {
    line,
    area,
    points,
  };
}

function calculateCharWidth(fontSize: number): number {
  const element = document.createElement("span");
  element.style.visibility = "hidden";
  element.style.position = "absolute";
  element.style.whiteSpace = "nowrap";
  element.style.fontSize = `${fontSize}px`;
  const sampleText =
    "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  element.textContent = sampleText;

  document.body.appendChild(element);
  const charWidth = element.offsetWidth / sampleText.length;
  document.body.removeChild(element);

  return charWidth;
}

function adjustLabelsForDisplay(
  options: FanOption[],
  chartWidth: number,
  theme: VictoryThemeDefinition
) {
  const labelMargin = 5;

  let charWidth: number;
  const tickLabelStyle = theme.axis?.style?.tickLabels;
  if (
    !Array.isArray(tickLabelStyle) &&
    typeof tickLabelStyle?.fontSize === "number"
  ) {
    charWidth = calculateCharWidth(tickLabelStyle.fontSize);
  } else {
    charWidth = calculateCharWidth(9);
  }

  const labels = options.map((option) => option.name);
  const maxLabelLength = Math.max(...labels.map((label) => label.length));
  const maxLabelWidth = maxLabelLength * charWidth + labelMargin;
  let availableSpacePerLabel = chartWidth / labels.length;

  if (maxLabelWidth < availableSpacePerLabel) {
    return labels;
  }

  let step = 1;
  let visibleLabelsCount = labels.length;

  while (maxLabelWidth >= availableSpacePerLabel && step < labels.length) {
    visibleLabelsCount = Math.ceil(labels.length / step);
    availableSpacePerLabel = chartWidth / visibleLabelsCount;
    step++;
  }

  return options.map((option, index) =>
    index % step === 0 ? option.name : ""
  );
}

export default FanChart;
