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
import {
  Scaling,
  Quartiles,
  QuestionWithNumericForecasts,
} from "@/types/question";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/charts";

import { generateNumericAreaTicks } from "./continuous_area_chart";

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
  height = 220,
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

  const { line, area, points, scaling } = useMemo(
    () => buildChartData(options),
    [options]
  );
  const labels = adjustLabelsForDisplay(options, chartWidth, actualTheme);
  const { ticks, tickFormat } = generateNumericAreaTicks(
    scaling,
    options[0].question.type,
    height
  );

  const tooltipItems = useMemo(
    () =>
      options.reduce<
        Record<
          string,
          { quartiles: Quartiles; question: QuestionWithNumericForecasts }
        >
      >(
        (acc, el) => ({
          ...acc,
          [el.name]: { quartiles: el.quartiles, question: el.question },
        }),
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
          <VictoryAxis
            dependentAxis
            label={yLabel}
            tickValues={ticks}
            tickFormat={tickFormat}
            style={{ ticks: { strokeWidth: 1 } }}
          />
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

  const zeroPoints: number[] = [];
  options.forEach((option) => {
    if (option.question.scaling.zero_point !== null) {
      zeroPoints.push(option.question.scaling.zero_point);
    }
  });
  const scaling: Scaling = {
    range_max: Math.max(
      ...options.map((option) => option.question.scaling.range_max!)
    ),
    range_min: Math.min(
      ...options.map((option) => option.question.scaling.range_min!)
    ),
    zero_point: zeroPoints.length > 0 ? Math.min(...zeroPoints) : null,
  };
  // we can have mixes of log and linear scaled options
  // which leads to a derived zero point inside the range which is invalid
  // so just igore the log scaling in this case
  if (
    scaling.zero_point !== null &&
    scaling.range_min! <= scaling.zero_point &&
    scaling.zero_point <= scaling.range_max!
  ) {
    scaling.zero_point = null;
  }

  for (const option of options) {
    // scale up the values to nominal values
    // then unscale by the derived scaling
    const median = unscaleNominalLocation(
      scaleInternalLocation(option.quartiles.median, option.question.scaling),
      scaling
    );
    const lower25 = unscaleNominalLocation(
      scaleInternalLocation(option.quartiles.lower25, option.question.scaling),
      scaling
    );
    const upper75 = unscaleNominalLocation(
      scaleInternalLocation(option.quartiles.upper75, option.question.scaling),
      scaling
    );

    line.push({
      x: option.name,
      y: median,
    });
    area.push({
      x: option.name,
      y0: lower25,
      y: upper75,
    });
    points.push({
      x: option.name,
      y: median,
      resolved: option.resolved,
    });
  }

  return {
    line,
    area,
    points,
    scaling,
  };
}

function calculateCharWidth(fontSize: number): number {
  if (typeof document === "undefined") {
    return 0;
  }

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
  if (!charWidth) {
    return labels;
  }

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
