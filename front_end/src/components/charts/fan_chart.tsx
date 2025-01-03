"use client";
import { isNil, merge } from "lodash";
import React, { FC, useMemo, useState } from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryThemeDefinition,
  VictoryVoronoiContainer,
} from "victory";

import ChartFanTooltip from "@/components/charts/primitives/chart_fan_tooltip";
import FanPoint from "@/components/charts/primitives/fan_point";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { Area, FanOption, Line } from "@/types/charts";
import {
  ForecastAvailability,
  Quartiles,
  Question,
  QuestionType,
  QuestionWithNumericForecasts,
  Scaling,
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
  hideCP?: boolean;
  forecastAvailability?: ForecastAvailability;
};

const FanChart: FC<Props> = ({
  options,
  height = 220,
  yLabel,
  withTooltip = false,
  extraTheme,
  pointSize,
  hideCP,
  forecastAvailability,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();

  const filteredOptions = [...options].filter((o) => o.resolved || o.quartiles);
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

  const labels = adjustLabelsForDisplay(
    filteredOptions,
    chartWidth,
    actualTheme
  );
  const yScale = generateScale({
    // we expect fan graph to be rendered only for group questions, that expect some options
    // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
    displayType: options[0]!.question.type,
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
      filteredOptions.reduce<
        Record<
          string,
          {
            quartiles: Quartiles | undefined;
            question: QuestionWithNumericForecasts;
          }
        >
      >(
        (acc, el) => ({
          ...acc,
          [el.name]: { quartiles: el.quartiles, question: el.question },
        }),
        {}
      ),
    [filteredOptions]
  );

  const shouldDisplayChart = !!chartWidth;
  return (
    <div ref={chartContainerRef} className="relative w-full" style={{ height }}>
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
          {!hideCP && (
            <VictoryArea
              name="fanArea"
              data={area}
              style={{
                data: {
                  opacity: 0.3,
                },
              }}
            />
          )}
          {!hideCP && <VictoryLine name="fanLine" data={line} />}
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
          <VictoryAxis tickFormat={(_, index) => labels[index] ?? ""} />
          {!hideCP && !forecastAvailability?.cpRevealsOn && (
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
          )}
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
      <ForecastAvailabilityChartOverflow
        forecastAvailability={forecastAvailability}
        className="text-xs lg:text-sm"
        textClassName="!max-w-[300px]"
      />
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
    if (option.question.scaling.zero_point !== null && !!option.quartiles) {
      zeroPoints.push(option.question.scaling.zero_point);
    }
  });

  const rangeMaxValues: number[] = [];
  const rangeMinValues: number[] = [];
  for (const option of options) {
    if (!isNil(option.question.scaling.range_max)) {
      rangeMaxValues.push(option.question.scaling.range_max);
    }

    if (!isNil(option.question.scaling.range_min)) {
      rangeMinValues.push(option.question.scaling.range_min);
    }
  }

  const scaling: Scaling = {
    range_max: rangeMaxValues.length > 0 ? Math.max(...rangeMaxValues) : null,
    range_min: rangeMinValues.length > 0 ? Math.min(...rangeMinValues) : null,
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
    !isNil(scaling.range_min) &&
    !isNil(scaling.range_max) &&
    scaling.range_min <= scaling.zero_point &&
    scaling.zero_point <= scaling.range_max
  ) {
    scaling.zero_point = null;
  }

  if (options[0]?.question.type === QuestionType.Binary) {
    for (const option of options) {
      if (!!option.quartiles) {
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
      }
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
      if (!!option.quartiles) {
        // scale up the values to nominal values
        // then unscale by the derived scaling
        const median = unscaleNominalLocation(
          scaleInternalLocation(
            option.quartiles.median,
            option.question.scaling
          ),
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
      }
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
  if (isNil(resolution)) {
    // fallback, usually we don't expect this, as function will be called only for resolved questions
    return 0;
  }

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
      : unscaleNominalLocation(new Date(resolution).getTime() / 1000, scaling);
  }
}

export default FanChart;
