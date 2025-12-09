"use client";

import { isNil, merge } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, memo, useEffect, useMemo, useRef, useState } from "react";
import { v4 } from "uuid";
import {
  CursorCoordinatesPropType,
  DomainTuple,
  LineSegment,
  PointProps,
  VictoryArea,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryCursorContainer,
  VictoryLabel,
  VictoryLabelProps,
  VictoryPortal,
  VictoryScatter,
  VictoryStack,
  VictoryThemeDefinition,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import {
  BaseChartData,
  Line,
  ScaleDirection,
  TickFormat,
  TimelineChartZoomOption,
} from "@/types/charts";
import { ChoiceItem } from "@/types/choices";
import { ForecastAvailability, QuestionType, Scaling } from "@/types/question";
import { ThemeColor } from "@/types/theme";
import {
  generateNumericXDomain,
  generateScale,
  generateTimestampXScale,
  generateTimeSeriesYDomain,
  getTickLabelFontSize,
  getAxisRightPadding,
} from "@/utils/charts/axis";
import { findPreviousTimestamp } from "@/utils/charts/cursor";
import { truncateLabel } from "@/utils/formatters/string";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/math";

import ChartContainer from "./primitives/chart_container";
import ChartCursorLabel from "./primitives/chart_cursor_label";
import XTickLabel from "./primitives/x_tick_label";
import ForecastAvailabilityChartOverflow from "../post_card/chart_overflow";
import SvgWrapper from "./primitives/svg_wrapper";
import YTickLabel from "./primitives/y_tick_label";

type ColoredLinePoint = {
  x: number;
  y: number | null;
  y1?: number;
  y2?: number;
  color: ThemeColor;
};

type ColoredLine = ColoredLinePoint[];

type Props = {
  timestamps: number[];
  actualCloseTime?: number | null;
  choiceItems: ChoiceItem[];
  defaultZoom?: TimelineChartZoomOption;
  withZoomPicker?: boolean;
  height?: number;
  yLabel?: string;
  hideCP?: boolean;
  onCursorChange?: (value: number, format: TickFormat) => void;
  onChartReady?: () => void;
  attachRef?: (node: HTMLElement | null) => void;
  extraTheme?: VictoryThemeDefinition;
  scaling?: Scaling;
  isClosed?: boolean;
  aggregation?: boolean;
  openTime?: number | null;
  forceAutoZoom?: boolean;
  isEmbedded?: boolean;
  forecastAvailability?: ForecastAvailability;
  forFeedPage?: boolean;
  chartTitle?: string;
};

const LABEL_FONT_FAMILY = "Inter";
const BOTTOM_PADDING = 20;
const TICK_FONT_SIZE = 10;

const MultipleChoiceChart: FC<Props> = ({
  timestamps,
  actualCloseTime,
  choiceItems,
  defaultZoom = TimelineChartZoomOption.All,
  withZoomPicker = false,
  height = 150,
  yLabel,
  hideCP,
  onCursorChange,
  onChartReady,
  attachRef,
  extraTheme,
  scaling,
  isClosed,
  aggregation,
  openTime,
  forceAutoZoom,
  isEmbedded,
  forecastAvailability,
  forFeedPage,
  chartTitle,
}) => {
  const questionKey = useMemo(() => v4(), []);
  const t = useTranslations();
  const {
    ref: chartContainerRef,
    width: chartWidth,
    height: chartHeight,
  } = useContainerSize<HTMLDivElement>();
  const isEmptyDomain =
    !!forecastAvailability?.isEmpty || !!forecastAvailability?.cpRevealsOn;
  const { theme, getThemeColor } = useAppTheme();
  const isDarkTheme = theme === "dark";
  const chartTheme = isDarkTheme ? darkTheme : lightTheme;
  const actualTheme = extraTheme
    ? merge({}, chartTheme, extraTheme)
    : chartTheme;
  const tickLabelFontSize = getTickLabelFontSize(actualTheme);

  const defaultCursor = useMemo(
    () =>
      isClosed
        ? actualCloseTime
          ? actualCloseTime / 1000
          : timestamps[timestamps.length - 1]
        : Date.now() / 1000,
    [actualCloseTime, isClosed, timestamps]
  );
  const [isCursorActive, setIsCursorActive] = useState(false);

  const [zoom, setZoom] = useState<TimelineChartZoomOption>(defaultZoom);
  const { xScale, yScale, graphs, xDomain, yDomain, userScatters } = useMemo(
    () =>
      buildChartData({
        timestamps,
        choiceItems,
        width: chartWidth,
        height: chartHeight,
        zoom,
        scaling,
        actualCloseTime,
        aggregation,
        extraTheme,
        hideCP,
        isAggregationsEmpty: isEmptyDomain,
        openTime,
        forceAutoZoom,
        forFeedPage,
      }),
    [
      timestamps,
      choiceItems,
      chartWidth,
      chartHeight,
      zoom,
      scaling,
      actualCloseTime,
      aggregation,
      extraTheme,
      hideCP,
      isEmptyDomain,
      openTime,
      forceAutoZoom,
      forFeedPage,
    ]
  );

  const { rightPadding, MIN_RIGHT_PADDING } = useMemo(() => {
    return getAxisRightPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);
  const maxRightPadding = useMemo(() => {
    return Math.max(rightPadding, MIN_RIGHT_PADDING);
  }, [rightPadding, MIN_RIGHT_PADDING]);

  const shouldDisplayChart = !!chartWidth;

  const prevWidth = usePrevious(chartWidth);
  useEffect(() => {
    if (!prevWidth && chartWidth && onChartReady) {
      onChartReady();
    }
  }, [onChartReady, prevWidth, chartWidth]);

  const CursorContainer = (
    <VictoryCursorContainer
      containerRef={attachRef}
      cursorDimension={"x"}
      defaultCursorValue={defaultCursor}
      style={{
        touchAction: "pan-y",
      }}
      cursorLabelOffset={{
        x: 0,
        y: 0,
      }}
      cursorLabel={({ datum }: VictoryLabelProps) => {
        if (datum) {
          return datum.x === defaultCursor
            ? isClosed
              ? ""
              : t("now")
            : xScale.cursorFormat?.(datum.x) ?? xScale.tickFormat(datum.x);
        }
      }}
      cursorComponent={
        <LineSegment
          style={
            isCursorActive
              ? {
                  stroke: getThemeColor(METAC_COLORS.gray["600"]),
                  strokeDasharray: "2,1",
                }
              : {
                  stroke: "transparent",
                }
          }
        />
      }
      cursorLabelComponent={
        <ChartCursorLabel positionY={height - 10} isActive={isCursorActive} />
      }
      onCursorChange={(value: CursorCoordinatesPropType) => {
        if (typeof value === "number" && onCursorChange) {
          const lastTimestamp = timestamps[timestamps.length - 1];
          if (value === lastTimestamp) {
            onCursorChange(lastTimestamp, xScale.tickFormat);
            return;
          }

          const closestTimestamp = findPreviousTimestamp(timestamps, value);

          onCursorChange(closestTimestamp, xScale.tickFormat);
        }
      }}
    />
  );

  const topPadding = isEmbedded ? 0 : height < 150 ? 5 : 10;
  const BASE_BOTTOM_PADDING = 20;
  const EMBED_EXTRA_BOTTOM_PADDING = 6;

  const bottomPadding = isEmbedded
    ? BASE_BOTTOM_PADDING - EMBED_EXTRA_BOTTOM_PADDING
    : BASE_BOTTOM_PADDING;

  return (
    <div className="relative" ref={chartContainerRef}>
      <ChartContainer
        height={height}
        zoom={withZoomPicker ? zoom : undefined}
        onZoomChange={setZoom}
        chartTitle={chartTitle}
      >
        {shouldDisplayChart && (
          <VictoryChart
            width={chartWidth}
            height={height}
            theme={actualTheme}
            padding={{
              left: 0,
              top: topPadding,
              right: maxRightPadding,
              bottom: bottomPadding,
            }}
            events={[
              {
                target: "parent",
                eventHandlers: {
                  onMouseOverCapture: () => {
                    if (!onCursorChange) return;
                    setIsCursorActive(true);
                  },
                  onMouseOutCapture: () => {
                    if (!onCursorChange) return;
                    setIsCursorActive(false);
                  },
                },
              },
            ]}
            containerComponent={
              onCursorChange ? (
                CursorContainer
              ) : (
                <VictoryContainer
                  containerRef={attachRef}
                  style={{
                    pointerEvents: "auto",
                    userSelect: "auto",
                    touchAction: "auto",
                  }}
                />
              )
            }
            domain={{
              x: xDomain,
              y: yDomain,
            }}
          >
            {/* Add linear gradient for resolved area */}
            {graphs.map(({ choice, color, active, resolutionPoint }, index) =>
              active && !isNil(resolutionPoint) ? (
                <SvgWrapper key={`gradient-${index}-${choice}`}>
                  <linearGradient
                    id={`gradient-${index}-${questionKey}`}
                    gradientUnits="userSpaceOnUse"
                    x1="0"
                    y1="0"
                    x2={chartWidth}
                    y2="0"
                  >
                    <stop
                      offset="0.3"
                      stopColor={getThemeColor(color)}
                      stopOpacity={isDarkTheme ? 0.4 : 0.5}
                    />
                    <stop
                      offset="1"
                      stopColor={getThemeColor(color)}
                      stopOpacity={1}
                    />
                  </linearGradient>
                </SvgWrapper>
              ) : null
            )}

            {/* Y axis */}
            <VictoryAxis
              dependentAxis
              tickValues={yScale.ticks}
              tickFormat={yScale.tickFormat}
              tickLabelComponent={
                <YTickLabel
                  nudgeTop={isEmbedded ? 6 : 0}
                  nudgeBottom={isEmbedded ? 6 : 0}
                />
              }
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
                grid: isEmptyDomain
                  ? {
                      stroke: getThemeColor(METAC_COLORS.gray["300"]),
                      strokeWidth: 1,
                      strokeDasharray: "2, 5",
                    }
                  : {
                      stroke: "transparent",
                    },
              }}
              label={yLabel}
              offsetX={
                isNil(yLabel) ? chartWidth + 5 : chartWidth - TICK_FONT_SIZE + 5
              }
              orientation={"left"}
              axisLabelComponent={<VictoryLabel x={chartWidth} />}
            />
            <VictoryAxis
              tickValues={xScale.ticks}
              tickFormat={
                hideCP ||
                isCursorActive ||
                !!forecastAvailability?.isEmpty ||
                !!forecastAvailability?.cpRevealsOn
                  ? () => ""
                  : xScale.tickFormat
              }
              tickLabelComponent={
                <VictoryPortal>
                  <XTickLabel
                    chartWidth={chartWidth}
                    withCursor={!!onCursorChange}
                    fontSize={tickLabelFontSize as number}
                    dx={isEmbedded ? 16 : 0}
                  />
                </VictoryPortal>
              }
              style={{
                ticks: {
                  stroke: "transparent",
                },
                axis: {
                  stroke: "transparent",
                },
                tickLabels: {
                  fill: getThemeColor(METAC_COLORS.gray["700"]),
                },
              }}
            />

            {!hideCP && !isEmptyDomain && (
              <VictoryStack
                colorScale="qualitative"
                style={{
                  data: {
                    fill: "none",
                    backgroundColor: getThemeColor(METAC_COLORS.gray["200"]),
                  },
                }}
              >
                {graphs.map(
                  ({ line, choice, color, active, resolutionPoint }, index) => {
                    return active ? (
                      <VictoryArea
                        key={`multiple-choice-line-${index}-${choice}`}
                        data={line}
                        style={{
                          data: {
                            strokeWidth: 2,
                            stroke: getThemeColor(METAC_COLORS.gray["0"]),
                            fill: isNil(resolutionPoint)
                              ? getThemeColor(color)
                              : `url(#gradient-${index}-${questionKey})`,
                            fillOpacity: isNil(resolutionPoint)
                              ? isDarkTheme
                                ? 0.4
                                : 0.5
                              : 1,
                            strokeOpacity: 1,
                          },
                        }}
                        interpolation="stepAfter"
                      />
                    ) : null;
                  }
                )}
              </VictoryStack>
            )}
            {/* User predictions */}
            {userScatters.map((scatter, index) => (
              <VictoryScatter
                key={`multiple-choice-scatter-${index}`}
                data={[scatter]}
                dataComponent={<PredictionRectangle />}
                size={4}
              />
            ))}
            {/* Resolution chip */}
            {!isCursorActive &&
              graphs.map(
                ({ color, active, resolutionPoint, choice }, index) => {
                  if (!resolutionPoint || !active) return null;

                  return (
                    <VictoryScatter
                      key={`multiple-choice-resolution-${index}-${choice}`}
                      data={[
                        {
                          x: resolutionPoint?.x,
                          y: resolutionPoint?.y,
                          symbol: "diamond",
                          size: 4,
                        },
                      ]}
                      dataComponent={
                        <VictoryPortal>
                          <ResolutionChip
                            x={resolutionPoint?.x}
                            y={resolutionPoint?.y}
                            color={getThemeColor(color)}
                            chartHeight={height - BOTTOM_PADDING}
                            text={choice}
                            compact={isEmbedded || forFeedPage}
                          />
                        </VictoryPortal>
                      }
                    />
                  );
                }
              )}
          </VictoryChart>
        )}
      </ChartContainer>
      <ForecastAvailabilityChartOverflow
        forecastAvailability={forecastAvailability}
        className="pl-0 text-xs lg:text-sm"
        textClassName="!max-w-[300px] pl-0 text-gray-700 dark:text-gray-700-dark"
      />
    </div>
  );
};

export type ChoiceGraph = {
  line: Line;
  scatter?: Line;
  resolutionPoint?: {
    x?: number;
    y: number;
    color?: ThemeColor;
  };
  choice: string;
  color: ThemeColor;
  active: boolean;
  highlighted: boolean;
};
type ChartData = BaseChartData & {
  graphs: ChoiceGraph[];
  userScatters: ColoredLine;
  xDomain: DomainTuple;
  yDomain: DomainTuple;
};

const roundToDecimals = (value: number, decimals = 3): number => {
  return Number(Math.round(Number(value + "e" + decimals)) + "e-" + decimals);
};

function buildChartData({
  height,
  width,
  choiceItems,
  timestamps,
  actualCloseTime,
  zoom,
  scaling,
  aggregation,
  extraTheme,
  hideCP,
  isAggregationsEmpty,
  openTime,
  forFeedPage,
}: {
  timestamps: number[];
  actualCloseTime?: number | null;
  choiceItems: ChoiceItem[];
  width: number;
  height: number;
  zoom: TimelineChartZoomOption;
  scaling?: Scaling;
  aggregation?: boolean;
  extraTheme?: VictoryThemeDefinition;
  hideCP?: boolean;
  isAggregationsEmpty?: boolean;
  openTime?: number | null;
  forceAutoZoom?: boolean;
  forFeedPage?: boolean;
}): ChartData {
  const closeTimes = choiceItems
    .map(({ closeTime }) => closeTime)
    .filter((t) => t !== undefined);
  const latestTimestamp = actualCloseTime
    ? Math.min(actualCloseTime / 1000, Date.now() / 1000)
    : !!closeTimes.length && closeTimes.length === choiceItems.length
      ? Math.min(
          Math.max(...closeTimes.map((t) => t / 1000)),
          Date.now() / 1000
        )
      : Date.now() / 1000;

  const activeItems = choiceItems.filter((c) => c.active);
  const shouldNormalize = activeItems.length > 1;

  // for MC questions userTimestamps will be the same array for every choice item
  const userTimestamps = choiceItems[0]?.userTimestamps ?? [];
  const userScatters: ColoredLine = [];
  userTimestamps.forEach((timestamp, timestampIndex) => {
    const denom = shouldNormalize
      ? activeItems.reduce((sum, it) => {
          const v = it.userValues[timestampIndex];
          return v != null ? sum + v : sum;
        }, 0)
      : 1;

    if (shouldNormalize && denom === 0) return;

    let cum = 0;
    activeItems.forEach((it) => {
      const raw = it.userValues[timestampIndex];
      if (raw == null) return;
      const v = shouldNormalize ? raw / (denom || 1) : raw;
      const y1 = cum;
      const y2 = roundToDecimals(cum + v);
      cum = y2;

      userScatters.push({
        x: timestamp,
        y: v,
        y1,
        y2,
        color: it.color,
      });
    });
  });

  const graphs: ChoiceGraph[] = isAggregationsEmpty
    ? []
    : choiceItems.map(
        ({
          choice,
          aggregationTimestamps,
          aggregationValues,
          userTimestamps,
          userValues,
          color,
          active,
          highlighted,
          closeTime,
          resolution,
          scaling: choiceScaling,
        }) => {
          const rescale = (val: number) => {
            if (scaling && choiceScaling) {
              return unscaleNominalLocation(
                scaleInternalLocation(val, choiceScaling),
                scaling
              );
            }
            return val;
          };

          const scatter: Line = [];
          const line: Line = [];
          userTimestamps.forEach((timestamp, timestampIndex) => {
            const userValue = userValues[timestampIndex];

            // build user scatter points
            if (
              !scatter.length ||
              userValue ||
              isNil(scatter[scatter.length - 1]?.y)
            ) {
              // we are either starting or have a real value or previous value is null
              scatter.push({
                x: timestamp,
                y: userValue ? rescale(userValue) : null,
                symbol: "circle",
              });
            } else {
              // we have a null value while previous was real
              const lastScatterItem = scatter.at(-1);
              if (!isNil(lastScatterItem)) {
                scatter.push({
                  x: timestamp,
                  y: lastScatterItem.y,
                  symbol: "x",
                });
              }

              scatter.push({
                x: timestamp,
                y: null,
                symbol: "circle",
              });
            }
          });
          if (!hideCP) {
            aggregationTimestamps.forEach((timestamp, timestampIndex) => {
              const aggregationValue = aggregationValues[timestampIndex];
              // build line (CP data)
              const val =
                aggregationValue != null ? rescale(aggregationValue) : null;

              const denom = shouldNormalize
                ? activeItems.reduce((sum, it) => {
                    const av = it.aggregationValues[timestampIndex];
                    if (av == null) return sum;
                    const rv =
                      scaling && it.scaling
                        ? unscaleNominalLocation(
                            scaleInternalLocation(av, it.scaling),
                            scaling
                          )
                        : av;
                    return sum + rv;
                  }, 0)
                : 1;

              const y =
                val != null
                  ? shouldNormalize
                    ? val / (denom || 1)
                    : val
                  : null;

              if (!line.length || y || isNil(line[line.length - 1]?.y)) {
                // we are either starting or have a real value or previous value is null
                line.push({
                  x: timestamp,
                  y,
                });
              } else {
                // we have a null vlalue while previous was real
                const lastLineItem = line.at(-1);
                if (!isNil(lastLineItem)) {
                  line.push({
                    x: timestamp,
                    y: lastLineItem.y,
                  });
                }

                line.push({
                  x: timestamp,
                  y: null,
                });
              }
            });
          }

          const item: ChoiceGraph = {
            choice,
            color,
            line,
            scatter,
            active,
            highlighted,
          };
          const resolveTime = closeTime ? closeTime / 1000 : latestTimestamp;
          if (item.line.length > 0) {
            item.line.push({
              x: resolveTime,
              y: item.line.at(-1)?.y ?? null,
            });
          }

          // Resolved item will be alwasys the first on the chart so we are good
          // to simply set y as last value of it without any additional calculations
          if (!isNil(resolution)) {
            const lastIdx = Math.max(
              0,
              (choiceItems[0]?.aggregationValues.length ?? 1) - 1
            );

            const denom = shouldNormalize
              ? activeItems.reduce((sum, it) => {
                  const av = it.aggregationValues[lastIdx];
                  if (av == null) return sum;
                  const rv =
                    scaling && it.scaling
                      ? unscaleNominalLocation(
                          scaleInternalLocation(av, it.scaling),
                          scaling
                        )
                      : av;
                  return sum + rv;
                }, 0)
              : 1;

            let y = 0;
            for (const choiceItem of choiceItems) {
              if (shouldNormalize && !choiceItem.active) continue;

              const lastValue = choiceItem.aggregationValues.at(-1);
              if (isNil(lastValue)) continue;

              const rv =
                scaling && choiceItem.scaling
                  ? unscaleNominalLocation(
                      scaleInternalLocation(lastValue, choiceItem.scaling),
                      scaling
                    )
                  : lastValue;

              const contrib = shouldNormalize ? (denom ? rv / denom : 0) : rv;

              if (choiceItem.choice === choice) {
                y = y + contrib / 2;
                break;
              }
              y = y + contrib;
            }

            if (resolution === choice) {
              item.resolutionPoint = {
                x: resolveTime,
                y,
              };
            }
          }

          return item;
        }
      );

  const domainTimestamps =
    isAggregationsEmpty && !!openTime
      ? [openTime / 1000, latestTimestamp]
      : aggregation
        ? timestamps
        : [...timestamps, latestTimestamp];

  const xDomain = generateNumericXDomain(domainTimestamps, zoom);
  const fontSize = extraTheme ? getTickLabelFontSize(extraTheme) : undefined;
  const xScale = generateTimestampXScale(xDomain, width, fontSize);

  const lines: Line = graphs
    .filter((g) => !isNil(g.line) && g.active)
    .flatMap((g) => g.line);
  const { originalYDomain } = generateTimeSeriesYDomain({
    zoom,
    minTimestamp: xDomain[0],
    isChartEmpty: !domainTimestamps.length,
    minValues: lines.map((l) => ({ timestamp: l.x, y: l.y })),
    maxValues: lines.map((l) => ({ timestamp: l.x, y: l.y })),
  });

  const yScale = generateScale({
    displayType: QuestionType.MultipleChoice,
    axisLength: height,
    direction: ScaleDirection.Vertical,
    scaling,
    domain: originalYDomain,
    forceTickCount: forFeedPage ? 3 : 5,
    alwaysShowTicks: true,
  });

  return {
    xScale,
    yScale: { ...yScale },
    graphs,
    userScatters,
    xDomain,
    yDomain: [0, 1.02],
  };
}

const ResolutionChip: FC<{
  x?: number | null;
  y?: number | null;
  datum?: { y?: number | null };
  chartHeight: number;
  compact?: boolean;
  text: string;
  color: string;
  scale?: {
    x: (x: number) => number;
    y: (y: number) => number;
  };
}> = (props) => {
  const TEXT_PADDING = 4;
  const RESOLUTION_TEXT_LIMIT = 12;
  const CHIP_HEIGHT = 16;
  const CHIP_FONT_SIZE = 12;
  const CHIP_LINE_WIDTH = 8;

  const { getThemeColor } = useAppTheme();
  const { x, y, compact, datum, chartHeight, text, color, scale } = props;
  const adjustedText = compact
    ? truncateLabel(text, RESOLUTION_TEXT_LIMIT)
    : text;
  const [textWidth, setTextWidth] = useState(0);
  const textRef = useRef<SVGTextElement>(null);

  useEffect(() => {
    if (textRef.current) {
      setTextWidth(textRef.current.getBBox().width + TEXT_PADDING);
    }
  }, [datum?.y]);

  if (isNil(x) || isNil(y) || isNil(scale)) {
    return null;
  }
  const desiredX =
    CHIP_LINE_WIDTH * 3 > textWidth
      ? scale.x(x) - textWidth / 2
      : scale.x(x) - textWidth + CHIP_LINE_WIDTH;

  const adjustedY = Math.min(
    chartHeight - CHIP_HEIGHT,
    scale.y(y) - CHIP_HEIGHT / 2
  );
  const isBottom = adjustedY === chartHeight - CHIP_HEIGHT;
  const adjustedTextY = isBottom ? adjustedY + CHIP_HEIGHT / 2 : scale.y(y);
  return (
    <g>
      <rect
        x={desiredX}
        y={adjustedY}
        width={textWidth}
        height={CHIP_HEIGHT}
        fill={color}
        stroke={getThemeColor(METAC_COLORS.gray["0"])}
        strokeWidth={1}
        rx={2}
        ry={2}
      />
      <text
        ref={textRef}
        x={desiredX + textWidth / 2}
        y={adjustedTextY}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={getThemeColor(METAC_COLORS.gray["0"])}
        fontWeight="medium"
        fontSize={CHIP_FONT_SIZE}
      >
        {adjustedText}
      </text>
    </g>
  );
};

type PredictionRectangleProps = PointProps;
const PredictionRectangle: React.FC<PredictionRectangleProps> = (props) => {
  const { x, y, datum, size, scale } = props;
  const { y1, y2, color } = datum;
  const { getThemeColor } = useAppTheme();

  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof size !== "number" ||
    !scale
  ) {
    return null;
  }

  const y1Scaled = scale.y(y1);
  const y2Scaled = scale.y(y2);

  const height = Math.abs(y2Scaled - y1Scaled);

  return (
    <g>
      <rect
        x={x - size / 2}
        y={Math.min(y1Scaled, y2Scaled)}
        width={size}
        height={height}
        fill={getThemeColor(color)}
        strokeWidth={1}
        stroke={getThemeColor(METAC_COLORS.gray["200"])}
        fillOpacity={1}
      />
    </g>
  );
};

export default memo(MultipleChoiceChart);
