"use client";
import { isNil, merge } from "lodash";
import React, { FC, useMemo, useState } from "react";
import {
  Tuple,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryLabel,
  VictoryLine,
  VictoryPortal,
  VictoryScatter,
  VictoryThemeDefinition,
  VictoryVoronoiContainer,
} from "victory";

import ChartFanTooltip from "@/components/charts/primitives/chart_fan_tooltip";
import FanPoint from "@/components/charts/primitives/fan_point";
import PredictionWithRange from "@/components/charts/primitives/prediction_with_range";
import ForecastAvailabilityChartOverflow from "@/components/post_card/chart_overflow";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import {
  Area,
  ContinuousForecastInputType,
  FanOption,
  Line,
  ScaleDirection,
  YDomain,
} from "@/types/charts";
import { PostGroupOfQuestions } from "@/types/post";
import {
  Quartiles,
  QuestionType,
  QuestionWithNumericForecasts,
  Scaling,
} from "@/types/question";
import {
  generateScale,
  generateYDomain,
  getAxisLeftPadding,
  getAxisRightPadding,
  getTickLabelFontSize,
} from "@/utils/charts/axis";
import {
  calculateCharWidth,
  getLineGraphTypeFromQuestion,
} from "@/utils/charts/helpers";
import { getResolutionPosition } from "@/utils/charts/resolution";
import {
  getQuantileNumericForecastDataset,
  getSliderNumericForecastDataset,
} from "@/utils/forecasts/dataset";
import { isForecastActive } from "@/utils/forecasts/helpers";
import {
  extractPrevBinaryForecastValue,
  extractPrevNumericForecastValue,
} from "@/utils/forecasts/initial_values";
import {
  computeQuartilesFromCDF,
  getCdfBounds,
  scaleInternalLocation,
  unscaleNominalLocation,
} from "@/utils/math";
import {
  getGroupForecastAvailability,
  getQuestionForecastAvailability,
} from "@/utils/questions/forecastAvailability";
import { sortGroupPredictionOptions } from "@/utils/questions/groupOrdering";
import { isUnsuccessfullyResolved } from "@/utils/questions/resolution";

const TOOLTIP_WIDTH = 150;
const LABEL_FONT_FAMILY = "Inter";
const TICK_FONT_SIZE = 10;
const BOTTOM_PADDING = 20;

type Props = {
  group: PostGroupOfQuestions<QuestionWithNumericForecasts>;
  height?: number;
  yLabel?: string;
  withTooltip?: boolean;
  extraTheme?: VictoryThemeDefinition;
  pointSize?: number;
  hideCP?: boolean;
  isEmbedded?: boolean;
  optionsLimit?: number;
};

const FanChart: FC<Props> = ({
  group,
  height = 220,
  yLabel,
  withTooltip = false,
  extraTheme,
  pointSize = 10,
  hideCP,
  isEmbedded = false,
  optionsLimit,
}) => {
  console.log(pointSize);
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;
  const tickLabelFontSize = getTickLabelFontSize(actualTheme);

  const [activePoint, setActivePoint] = useState<string | null>(null);

  const forecastAvailability = getGroupForecastAvailability(group.questions);

  const options = useMemo(() => {
    const options = getFanOptions(group);
    if (optionsLimit) {
      return options.slice(0, optionsLimit);
    }
    return options;
  }, [group, optionsLimit]);
  const {
    communityLines,
    communityAreas,
    communityPoints,
    userPoints,
    resolutionPoints,
    yScale,
    yDomain,
    emptyPoints,
  } = useMemo(() => buildChartData({ options, height }), [height, options]);

  const labels = adjustLabelsForDisplay(options, chartWidth, actualTheme);
  const { leftPadding, MIN_LEFT_PADDING } = useMemo(() => {
    return getAxisLeftPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);
  const maxLeftPadding = useMemo(() => {
    return Math.max(leftPadding, MIN_LEFT_PADDING);
  }, [leftPadding, MIN_LEFT_PADDING]);

  const { rightPadding, MIN_RIGHT_PADDING } = useMemo(() => {
    return getAxisRightPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);
  const maxRightPadding = useMemo(() => {
    return Math.max(rightPadding, MIN_RIGHT_PADDING);
  }, [rightPadding, MIN_RIGHT_PADDING]);

  const shouldDisplayChart = !!chartWidth;

  return (
    <div
      id="fan-graph-container"
      ref={chartContainerRef}
      className="relative w-full"
      style={{ height }}
    >
      {shouldDisplayChart && (
        <VictoryChart
          width={chartWidth}
          height={height}
          theme={actualTheme}
          domain={{
            y: yDomain,
          }}
          domainPadding={{
            x: TOOLTIP_WIDTH / 2,
          }}
          padding={{
            left: isEmbedded ? maxLeftPadding : 0,
            top: 10,
            right: isEmbedded ? 10 : maxRightPadding,
            bottom: BOTTOM_PADDING,
          }}
          containerComponent={
            withTooltip ? (
              <VictoryVoronoiContainer
                voronoiBlacklist={[
                  "communityFanArea",
                  "userFanArea",
                  "communityFanLine",
                  "userFanLine",
                ]}
                style={{
                  touchAction: "pan-y",
                }}
                labels={({ datum }: { datum: any }) => datum.x}
                labelComponent={
                  <ChartFanTooltip
                    chartHeight={height}
                    options={options}
                    hideCp={hideCP}
                    forecastAvailability={forecastAvailability}
                  />
                }
                onActivated={(points: any) => {
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
          {/* Y axis */}
          <VictoryAxis
            dependentAxis
            style={{
              ticks: {
                stroke: "transparent",
              },
              axisLabel: {
                fontFamily: LABEL_FONT_FAMILY,
                fontSize: tickLabelFontSize,
                fill: getThemeColor(METAC_COLORS.gray["500"]),
              },
              tickLabels: {
                fontFamily: LABEL_FONT_FAMILY,
                padding: 5,
                fontSize: tickLabelFontSize,
                fill: getThemeColor(METAC_COLORS.gray["700"]),
              },
              axis: {
                stroke: "transparent",
              },
              grid: {
                stroke: getThemeColor(METAC_COLORS.gray["300"]),
                strokeWidth: 1,
                strokeDasharray: "2, 5",
              },
            }}
            tickValues={yScale.ticks}
            tickFormat={yScale.tickFormat}
            label={!isNil(yLabel) ? `(${yLabel})` : undefined}
            orientation={"left"}
            offsetX={
              isEmbedded
                ? maxLeftPadding
                : isNil(yLabel)
                  ? chartWidth + 5
                  : chartWidth - TICK_FONT_SIZE + 5
            }
            axisLabelComponent={<VictoryLabel x={chartWidth} />}
          />
          <VictoryPortal>
            <VictoryAxis
              tickValues={options.map((option) => option.name)}
              style={{
                ticks: {
                  stroke: "transparent",
                },
                axis: {
                  stroke: "transparent",
                },
              }}
              tickFormat={(_, index) => labels[index] ?? ""}
            />
          </VictoryPortal>
          {!hideCP &&
            communityAreas.map((area, index) => (
              <VictoryArea
                key={index}
                name={`communityFanArea-${index}`}
                data={area ?? []}
                style={{
                  data: {
                    opacity: 0.3,
                    fill: () =>
                      area?.[1]?.resolved
                        ? getThemeColor(METAC_COLORS.purple["300"])
                        : getThemeColor(METAC_COLORS.olive["300"]),
                  },
                }}
              />
            ))}
          {!hideCP &&
            communityLines.map((line, index) => (
              <VictoryLine
                key={index}
                name={`communityFanLine-${index}`}
                data={line ?? []}
                style={{
                  data: {
                    stroke: () =>
                      line?.[1]?.resolved
                        ? getThemeColor(METAC_COLORS.purple["700"])
                        : getThemeColor(METAC_COLORS.olive["700"]),
                  },
                }}
              />
            ))}

          <VictoryScatter
            data={userPoints}
            dataComponent={<PredictionWithRange />}
          />
          {!hideCP && !forecastAvailability?.cpRevealsOn && (
            <VictoryScatter
              data={communityPoints.map((point) => ({
                ...point,
                resolved: false,
                pointColor: getThemeColor(
                  point.resolved
                    ? METAC_COLORS.purple["800"]
                    : METAC_COLORS.olive["800"]
                ),
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
                <FanPoint
                  activePoint={activePoint}
                  pointSize={pointSize}
                  bottomPadding={BOTTOM_PADDING}
                />
              }
            />
          )}
          {resolutionPoints.map((point) => (
            <VictoryScatter
              key={point.x}
              data={[{ ...point, symbol: "diamond" }]}
              dataComponent={
                <FanPoint
                  activePoint={activePoint}
                  pointSize={pointSize}
                  unsuccessfullyResolved={point.unsuccessfullyResolved}
                  bgColor={getThemeColor(METAC_COLORS.gray["200"])}
                  bottomPadding={BOTTOM_PADDING}
                />
              }
            />
          ))}
          {emptyPoints.map((point) => (
            <VictoryScatter
              key={point.x}
              data={[{ ...point, symbol: "diamond" }]}
              dataComponent={
                <FanPoint
                  activePoint={activePoint}
                  pointSize={pointSize}
                  unsuccessfullyResolved={point.unsuccessfullyResolved}
                  bgColor={getThemeColor(METAC_COLORS.gray["200"])}
                  bottomPadding={BOTTOM_PADDING}
                  isClosed={true}
                />
              }
            />
          ))}
        </VictoryChart>
      )}
      {!withTooltip && (
        <ForecastAvailabilityChartOverflow
          forecastAvailability={forecastAvailability}
          className="text-xs lg:text-sm"
          textClassName="!max-w-[300px]"
        />
      )}
    </div>
  );
};

type FanGraphPoint = {
  x: string;
  y: number;
  resolved?: boolean;
  unsuccessfullyResolved?: boolean;
};

function buildChartData({
  options,
  height,
}: {
  options: FanOption[];
  height: number;
}) {
  // we expect fan graph to be rendered only for group questions, that expect some options
  // eslint-disable-next-line @typescript-eslint/no-non-null-assertion
  const groupType = options[0]!.question.type;
  const isBinaryGroup = groupType === QuestionType.Binary;

  const communityLines: (Line<string> | null)[] = [];
  const communityAreas: (Area<string> | null)[] = [];
  const userArea: Area<string> = [];
  const communityPoints: Array<FanGraphPoint> = [];
  const userPoints: Array<FanGraphPoint> = [];
  const resolutionPoints: Array<FanGraphPoint> = [];
  const emptyPoints: Array<FanGraphPoint> = [];
  const scaling = getFanGraphScaling(options);

  let lastPointResolved = false;

  for (const option of options) {
    const unsuccessfullyResolved = isUnsuccessfullyResolved(
      option.question.resolution
    );
    const questionForecastAvailability = getQuestionForecastAvailability(
      option.question
    );
    const isResolved = option.resolved && !unsuccessfullyResolved;

    if (
      questionForecastAvailability.isEmpty ||
      questionForecastAvailability.cpRevealsOn
    ) {
      emptyPoints.push({
        x: option.name,
        y: 0,
      });
      continue;
    }
    if (option.communityQuartiles) {
      const {
        linePoint: communityLinePoint,
        areaPoint: communityAreaPoint,
        point: communityPoint,
      } = getOptionGraphData({
        name: option.name,
        quartiles: option.communityQuartiles,
        optionScaling: option.question.scaling,
        scaling,
        withoutScaling: isBinaryGroup,
        resolved: option.resolved,
      });

      if (!unsuccessfullyResolved) {
        if (communityLines.length === 0) {
          communityLines.push([
            { ...communityLinePoint, resolved: isResolved },
          ]);
          communityAreas.push([
            { ...communityAreaPoint, resolved: isResolved },
          ]);
        } else {
          communityLines.push([
            {
              ...(communityLines.at(-1)?.at(-1) ?? communityLinePoint),
              resolved: lastPointResolved,
            },
            { ...communityLinePoint, resolved: isResolved },
          ]);
          communityAreas.push([
            {
              ...(communityAreas.at(-1)?.at(-1) ?? communityAreaPoint),
              resolved: lastPointResolved,
            },
            { ...communityAreaPoint, resolved: isResolved },
          ]);
        }
        communityPoints.push(communityPoint);
        lastPointResolved = isResolved;
      } else {
        communityLines.push(null);
        communityAreas.push(null);
      }
    }
    if (option.resolved) {
      resolutionPoints.push({
        x: option.name,
        y: getResolutionPosition({
          question: option.question,
          scaling,
        }),
        unsuccessfullyResolved,
        resolved: true,
      });
    }
    if (option.userQuartiles) {
      const { areaPoint: userAreaPoint, point: userPoint } = getOptionGraphData(
        {
          name: option.name,
          quartiles: option.userQuartiles,
          optionScaling: option.question.scaling,
          scaling,
          withoutScaling: isBinaryGroup,
          resolved: option.resolved,
        }
      );
      if (!isBinaryGroup) {
        userArea.push(userAreaPoint);
      }
      userPoints.push(userPoint);
    }
  }

  const { originalYDomain, zoomedYDomain } = generateFanGraphYDomain({
    communityAreas,
    userArea,
    resolutionPoints: isBinaryGroup ? [] : resolutionPoints,
    includeClosestBoundOnZoom: isBinaryGroup,
  });

  const yScale = generateScale({
    displayType: groupType,
    axisLength: height,
    direction: ScaleDirection.Vertical,
    scaling: scaling,
    domain: originalYDomain,
    zoomedDomain: zoomedYDomain,
    forceTickCount: 5,
    alwaysShowTicks: true,
  });

  // adjust resolution points to render annuled point in the middle of zoomed domain
  // and render binary resolution on the edge of zoomed domain
  resolutionPoints.forEach((point) => {
    if (point.unsuccessfullyResolved) {
      point.y =
        Math.round(((zoomedYDomain[0] + zoomedYDomain[1]) / 2) * 100) / 100;
    } else if (isBinaryGroup) {
      point.y = point.y === 0 ? zoomedYDomain[0] : zoomedYDomain[1];
    }
  });
  emptyPoints.forEach((point) => {
    point.y =
      Math.round(((zoomedYDomain[0] + zoomedYDomain[1]) / 2) * 100) / 100;
  });

  return {
    communityLines,
    communityAreas,
    communityPoints,
    userPoints,
    resolutionPoints,
    yScale,
    yDomain: zoomedYDomain,
    emptyPoints,
  };
}

function getFanGraphScaling(options: FanOption[]): Scaling {
  const zeroPoints: number[] = [];
  const rangeMaxValues: number[] = [];
  const rangeMinValues: number[] = [];
  for (const option of options) {
    if (
      !isNil(option.question.scaling.zero_point) &&
      !!option.communityQuartiles
    ) {
      zeroPoints.push(option.question.scaling.zero_point);
    }

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

  return scaling;
}

function generateFanGraphYDomain({
  communityAreas,
  resolutionPoints,
  userArea,
  includeClosestBoundOnZoom,
}: {
  communityAreas: Array<Area<string> | null>;
  userArea: Area<string>;
  resolutionPoints: Array<FanGraphPoint>;
  includeClosestBoundOnZoom?: boolean;
}): YDomain {
  const originalYDomain: Tuple<number> = [0, 1];
  const fallback = { originalYDomain, zoomedYDomain: originalYDomain };

  const combinedAreaData = [
    ...communityAreas.map((area) => (area ? area : [])),
    ...userArea,
  ];
  const minValues: number[] = [];
  const maxValues: number[] = [];
  for (const areaPoint of combinedAreaData.flat()) {
    if (!isNil(areaPoint.y0)) {
      minValues.push(areaPoint.y0);
    }
    if (!isNil(areaPoint.y)) {
      maxValues.push(areaPoint.y);
    }
  }
  for (const resolutionPoint of resolutionPoints) {
    if (!isNil(resolutionPoint.y)) {
      minValues.push(resolutionPoint.y);
      maxValues.push(resolutionPoint.y);
    }
  }
  const minValue = minValues.length ? Math.min(...minValues) : null;
  const maxValue = maxValues.length ? Math.max(...maxValues) : null;

  if (isNil(minValue) || isNil(maxValue)) {
    return fallback;
  }

  return generateYDomain({
    minValue,
    maxValue,
    includeClosestBoundOnZoom,
  });
}

function getOptionGraphData({
  name,
  quartiles,
  scaling,
  optionScaling,
  withoutScaling,
  resolved,
}: {
  name: string;
  quartiles: Quartiles;
  optionScaling: Scaling;
  scaling: Scaling;
  withoutScaling: boolean;
  resolved: boolean;
}) {
  if (withoutScaling) {
    return {
      linePoint: {
        x: name,
        y: quartiles.median,
      },
      areaPoint: {
        x: name,
        y0: quartiles.lower25,
        y: quartiles.upper75,
      },
      point: {
        x: name,
        y: quartiles.median,
        resolved,
      },
    };
  }

  // scale up the values to nominal values
  // then unscale by the derived scaling
  const median = unscaleNominalLocation(
    scaleInternalLocation(quartiles.median, optionScaling),
    scaling
  );
  const lower25 = unscaleNominalLocation(
    scaleInternalLocation(quartiles.lower25, optionScaling),
    scaling
  );
  const upper75 = unscaleNominalLocation(
    scaleInternalLocation(quartiles.upper75, optionScaling),
    scaling
  );

  return {
    linePoint: {
      x: name,
      y: median,
    },
    areaPoint: {
      x: name,
      y0: lower25,
      y: upper75,
    },
    point: {
      x: name,
      y: median,
      y1: lower25,
      y2: upper75,
      resolved,
    },
  };
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

function getFanOptions(
  group: PostGroupOfQuestions<QuestionWithNumericForecasts>
): FanOption[] {
  const { questions } = group;

  const groupType = questions.at(0)?.type;
  if (!groupType) {
    console.warn("Can't generate fan options. Group type is not defined.");
    return [];
  }

  const graphType = getLineGraphTypeFromQuestion(groupType);
  if (!graphType) {
    console.warn("Can't generate fan options. Graph type is not supported.");
    return [];
  }

  const sortedQuestions = sortGroupPredictionOptions(questions, group);

  return graphType === "binary"
    ? getFanOptionsFromBinaryGroup(sortedQuestions)
    : getFanOptionsFromContinuousGroup(sortedQuestions);
}

function getFanOptionsFromContinuousGroup(
  questions: QuestionWithNumericForecasts[]
): FanOption[] {
  return questions
    .map((q) => {
      const latest = q.my_forecasts?.latest;
      const userForecast = extractPrevNumericForecastValue(
        latest && isForecastActive(latest)
          ? latest.distribution_input
          : undefined
      );

      let userCdf: number[] | null = null;
      if (userForecast?.components) {
        userForecast.type === ContinuousForecastInputType.Slider
          ? (userCdf = getSliderNumericForecastDataset(
              userForecast.components,
              q
            ).cdf)
          : (userCdf = getQuantileNumericForecastDataset(
              userForecast.components,
              q
            ).cdf);
      }

      return {
        name: q.label,
        communityCdf:
          q.aggregations.recency_weighted.latest?.forecast_values ?? [],
        userCdf: userCdf,
        resolved: q.resolution !== null,
        question: q,
      };
    })
    .map(({ name, communityCdf, resolved, question, userCdf }) => ({
      name,
      communityQuartiles: communityCdf.length
        ? computeQuartilesFromCDF(communityCdf) ?? null
        : null,
      communityBounds: getCdfBounds(communityCdf) ?? null,
      userQuartiles: userCdf?.length ? computeQuartilesFromCDF(userCdf) : null,
      userBounds: userCdf ? getCdfBounds(userCdf) ?? null : null,
      resolved,
      question,
    }));
}

function getFanOptionsFromBinaryGroup(
  questions: QuestionWithNumericForecasts[]
): FanOption[] {
  return questions.map((q) => {
    const aggregation = q.aggregations.recency_weighted.latest;
    const resolved = q.resolution !== null;

    const latest = q.my_forecasts?.latest;
    const userForecast = extractPrevBinaryForecastValue(
      latest && isForecastActive(latest) ? latest.forecast_values[1] : null
    );

    return {
      name: q.label,
      communityQuartiles: !!aggregation
        ? {
            median: aggregation.centers?.[0] ?? 0,
            lower25: aggregation.interval_lower_bounds?.[0] ?? 0,
            upper75: aggregation.interval_upper_bounds?.[0] ?? 0,
          }
        : null,
      communityBounds: null,
      userQuartiles: userForecast
        ? {
            lower25: userForecast / 100,
            median: userForecast / 100,
            upper75: userForecast / 100,
          }
        : null,
      userBounds: null,
      resolved,
      question: q,
    };
  });
}

export default FanChart;
