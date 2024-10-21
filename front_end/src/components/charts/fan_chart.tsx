"use client";
import { isNil, merge } from "lodash";
import React, { FC, useMemo, useState } from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
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
  QuestionType,
  Question,
} from "@/types/question";
import {
  generateScale,
  getLeftPadding,
  getTickLabelFontSize,
  scaleInternalLocation,
  unscaleNominalLocation,
} from "@/utils/charts";

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
  const tickLabelFontSize = getTickLabelFontSize(actualTheme);

  const [activePoint, setActivePoint] = useState<string | null>(null);

  const { line, area, points, resolutionPoints, scaling } = useMemo(
    () => buildChartData(options),
    [options]
  );

  const labels = adjustLabelsForDisplay(options, chartWidth, actualTheme);
  const yScale = generateScale({
    displayType: options[0].question.type,
    axisLength: height,
    direction: "vertical",
    scaling: scaling,
  });
  const { ticks, tickFormat } = yScale;
  const { leftPadding, MIN_LEFT_PADDING } = useMemo(() => {
    return getLeftPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);

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
          padding={{
            left: Math.max(leftPadding, MIN_LEFT_PADDING),
            top: 10,
            right: 10,
            bottom: 20,
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
                opacity: 0.3,
              },
            }}
          />
          <VictoryLine name="fanLine" data={line} />
          <VictoryAxis
            dependentAxis
            label={yLabel}
            tickValues={ticks}
            tickFormat={tickFormat}
            style={{ ticks: { strokeWidth: 1 } }}
            offsetX={Math.max(leftPadding - 2, MIN_LEFT_PADDING - 2)}
            axisLabelComponent={
              <VictoryLabel
                dy={-Math.max(leftPadding - 40, MIN_LEFT_PADDING - 40)}
              />
            }
          />
          <VictoryAxis tickFormat={(_, index) => labels[index]} />
          <VictoryScatter
            data={points.map((point) => ({
              ...point,
              symbol: "square",
            }))}
            style={{
              data: {
                fill: () => getThemeColor(METAC_COLORS.olive["800"]),
                stroke: () => getThemeColor(METAC_COLORS.olive["800"]),
                strokeWidth: 6,
                strokeOpacity: ({ datum }) =>
                  activePoint === datum.x ? 0.3 : 0,
              },
            }}
            dataComponent={
              <FanPoint activePoint={activePoint} pointSize={pointSize} />
            }
          />
          <VictoryScatter
            data={resolutionPoints.map((point) => ({
              ...point,
              symbol: "diamond",
            }))}
            style={{
              data: {
                fill: "none",
                stroke: () => getThemeColor(METAC_COLORS.purple["800"]),
                strokeWidth: 2,
                strokeOpacity: 1,
              },
            }}
            dataComponent={
              <FanPoint activePoint={null} pointSize={pointSize} />
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
  const resolutionPoints: Array<{ x: string; y: number; resolved: boolean }> =
    [];
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
  if (scaling.range_max === scaling.range_min && scaling.range_max === 0) {
    scaling.range_max = 1;
  }

  // we can have mixes of log and linear scaled options
  // which leads to a derived zero point inside the range which is invalid
  // so just ignore the log scaling in this case
  if (
    scaling.zero_point !== null &&
    scaling.range_min! <= scaling.zero_point &&
    scaling.zero_point <= scaling.range_max!
  ) {
    scaling.zero_point = null;
  }

  if (options[0].question.type === QuestionType.Binary) {
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
        resolved: false,
      });
      if (option.resolved) {
        resolutionPoints.push({
          x: option.name,
          y: getResolutionPosition(option.question, scaling),
          resolved: true,
        });
      }
    }
  } else {
    for (const option of options) {
      // scale up the values to nominal values
      // then unscale by the derived scaling
      const median = unscaleNominalLocation(
        scaleInternalLocation(option.quartiles.median, option.question.scaling),
        scaling
      );
      const lower25 = unscaleNominalLocation(
        scaleInternalLocation(
          option.quartiles.lower25,
          option.question.scaling
        ),
        scaling
      );
      const upper75 = unscaleNominalLocation(
        scaleInternalLocation(
          option.quartiles.upper75,
          option.question.scaling
        ),
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
        resolved: false,
      });
      if (option.resolved) {
        resolutionPoints.push({
          x: option.name,
          y: getResolutionPosition(option.question, scaling),
          resolved: true,
        });
      }
    }
  }

  return {
    line,
    area,
    points,
    resolutionPoints,
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
  const averageChartPaddingXAxis = 100;
  let availableSpacePerLabel =
    (chartWidth - averageChartPaddingXAxis) / labels.length;

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

function getResolutionPosition(question: Question, scaling: Scaling) {
  const resolution = question.resolution;

  if (
    ["no", "below_lower_bound", "annulled", "ambiguous"].includes(
      resolution as string
    )
  ) {
    return 0;
  } else if (["yes", "above_upper_bound"].includes(resolution as string)) {
    return 1;
  } else {
    return question.type === QuestionType.Numeric
      ? unscaleNominalLocation(Number(resolution), scaling)
      : unscaleNominalLocation(new Date(resolution!).getTime() / 1000, scaling);
  }
}

export default FanChart;
