"use client";

import { isNil, merge } from "lodash";
import { useTranslations } from "next-intl";
import React, { FC, memo, useEffect, useMemo, useRef, useState } from "react";
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
  VictoryLine,
  VictoryPortal,
  VictoryScatter,
  VictoryThemeDefinition,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import {
  Area,
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
  generateTimeSeriesYDomain,
  generateTimestampXScale,
  getAxisRightPadding,
  getTickLabelFontSize,
} from "@/utils/charts/axis";
import { getResolutionPoint } from "@/utils/charts/resolution";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/math";

import ForecastAvailabilityChartOverflow from "../post_card/chart_overflow";
import ChartContainer from "./primitives/chart_container";
import ChartCursorLabel from "./primitives/chart_cursor_label";
import GroupResolutionPoint from "./primitives/group_resolution_point";
import ResolutionDiamond from "./primitives/resolution_diamond";
import XTickLabel from "./primitives/x_tick_label";

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
  questionType?: QuestionType;
  scaling?: Scaling;
  isClosed?: boolean;
  aggregation?: boolean;
  isEmptyDomain?: boolean;
  openTime?: number | null;
  forceAutoZoom?: boolean;
  cursorTimestamp?: number | null;
  forecastAvailability?: ForecastAvailability;
  forceShowLinePoints?: boolean;
  forFeedPage?: boolean;
  isEmbedded?: boolean;
  showCursorLabel?: boolean;
  fadeLinesOnHover?: boolean;
};

const LABEL_FONT_FAMILY = "Inter";
const BOTTOM_PADDING = 20;
const TICK_FONT_SIZE = 10;
const POINT_SIZE = 9;
const USER_POINT_SIZE = 6;
const USER_POINT_STROKE = 1.5;
const PLOT_TOP = 10;

const GroupChart: FC<Props> = ({
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
  questionType = QuestionType.Binary,
  scaling,
  isClosed,
  aggregation,
  isEmptyDomain,
  openTime,
  forceAutoZoom,
  cursorTimestamp,
  forecastAvailability,
  forceShowLinePoints = false,
  forFeedPage,
  isEmbedded = false,
  showCursorLabel = true,
  fadeLinesOnHover = true,
}) => {
  const t = useTranslations();
  const {
    ref: chartContainerRef,
    width: chartWidth,
    height: chartHeight,
  } = useContainerSize<HTMLDivElement>();
  const inPlotRef = useRef(false);

  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
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
  const { xScale, yScale, graphs, xDomain, yDomain } = useMemo(
    () =>
      buildChartData({
        timestamps,
        choiceItems,
        width: chartWidth,
        height: chartHeight,
        zoom,
        questionType,
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
      questionType,
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
  const [localCursorTimestamp, setLocalCursorTimestamp] = useState<
    number | null
  >(null);
  const effectiveCursorTimestamp = !isNil(cursorTimestamp)
    ? cursorTimestamp
    : localCursorTimestamp;
  const plotBottom =
    height - (isEmbedded ? BOTTOM_PADDING - 6 : BOTTOM_PADDING);
  const filteredLines = useMemo(() => {
    return graphs.map(({ line, active }) => {
      const lastLineX = line.at(-1)?.x;
      if (!active || !lastLineX) return null;

      if (isNil(effectiveCursorTimestamp)) return line;

      let filteredLine =
        lastLineX > effectiveCursorTimestamp
          ? line.filter(({ x }) => x <= effectiveCursorTimestamp)
          : line;

      if (lastLineX > effectiveCursorTimestamp) {
        filteredLine = [
          ...filteredLine,
          {
            x: effectiveCursorTimestamp,
            y: filteredLine.at(-1)?.y ?? null,
          },
        ];
      }

      return filteredLine;
    });
  }, [graphs, effectiveCursorTimestamp]);

  const { rightPadding, MIN_RIGHT_PADDING } = useMemo(() => {
    return getAxisRightPadding(yScale, tickLabelFontSize as number, yLabel);
  }, [yScale, tickLabelFontSize, yLabel]);
  const maxRightPadding = useMemo(() => {
    return Math.max(rightPadding, MIN_RIGHT_PADDING);
  }, [rightPadding, MIN_RIGHT_PADDING]);

  const isHighlightActive = useMemo(
    () => Object.values(choiceItems).some(({ highlighted }) => highlighted),
    [choiceItems]
  );

  const prevWidth = usePrevious(chartWidth);
  const baseLineOpacity =
    fadeLinesOnHover && isCursorActive && !isHighlightActive ? 0.35 : 1;

  useEffect(() => {
    if (!prevWidth && chartWidth && onChartReady) {
      onChartReady();
      if (onCursorChange) {
        onCursorChange(Number(xDomain[1]) ?? 0, xScale.tickFormat);
      }
    }
  }, [onChartReady, prevWidth, chartWidth, onCursorChange, xDomain, xScale]);

  const CursorContainer = (
    <VictoryCursorContainer
      containerRef={attachRef}
      cursorDimension={"x"}
      defaultCursorValue={defaultCursor}
      style={{
        touchAction: "pan-y",
      }}
      cursorLabelOffset={showCursorLabel ? { x: 0, y: 0 } : undefined}
      cursorLabel={
        showCursorLabel
          ? ({ datum }: VictoryLabelProps) => {
              if (!datum) return "";
              return datum.x === defaultCursor
                ? isClosed
                  ? ""
                  : t("now")
                : xScale.cursorFormat?.(datum.x) ?? xScale.tickFormat(datum.x);
            }
          : undefined
      }
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
        showCursorLabel ? (
          <VictoryPortal>
            <ChartCursorLabel
              positionY={height - (isEmbedded ? 4 : 10)}
              isActive={isCursorActive}
            />
          </VictoryPortal>
        ) : undefined
      }
      onCursorChange={(value: CursorCoordinatesPropType) => {
        if (typeof value !== "number") return;
        if (!inPlotRef.current) return;

        setLocalCursorTimestamp(value);

        if (onCursorChange) {
          const lastTimestamp = timestamps[timestamps.length - 1];
          if (value === lastTimestamp) {
            onCursorChange(lastTimestamp, xScale.tickFormat);
            return;
          }
          onCursorChange(value, xScale.tickFormat);
        }
      }}
    />
  );

  return (
    <div>
      <ChartContainer
        ref={chartContainerRef}
        height={height}
        zoom={withZoomPicker ? zoom : undefined}
        onZoomChange={setZoom}
      >
        {!!chartWidth && (
          <VictoryChart
            width={chartWidth}
            height={height}
            theme={actualTheme}
            domainPadding={{ y: 3 }}
            singleQuadrantDomainPadding={{ y: false }}
            padding={{
              left: 0,
              top: 10,
              right: maxRightPadding,
              bottom: isEmbedded ? BOTTOM_PADDING - 6 : BOTTOM_PADDING,
            }}
            events={[
              {
                target: "parent",
                eventHandlers: {
                  // eslint-disable-next-line @typescript-eslint/no-explicit-any
                  onMouseMoveCapture: (e: any) => {
                    if (!onCursorChange) return;
                    const svg =
                      (e.currentTarget as SVGElement).ownerSVGElement ??
                      e.currentTarget;
                    const rect = (svg as SVGElement).getBoundingClientRect();
                    const x = e.clientX - rect.left;
                    const y = e.clientY - rect.top;

                    const inPlot =
                      x >= 0 &&
                      x <= chartWidth - maxRightPadding &&
                      y >= PLOT_TOP &&
                      y <= plotBottom;
                    inPlotRef.current = inPlot;
                    setIsCursorActive(inPlot);
                    if (!inPlot) {
                      setLocalCursorTimestamp(null);
                    }
                  },
                  onMouseLeaveCapture: () => {
                    if (!onCursorChange) return;
                    inPlotRef.current = false;
                    setIsCursorActive(false);
                    setLocalCursorTimestamp(null);
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
            {/* Y axis */}
            <VictoryAxis
              dependentAxis
              tickValues={yScale.ticks}
              tickFormat={yScale.tickFormat}
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
                  stroke: getThemeColor(METAC_COLORS.gray["400"]),
                  strokeWidth: 1,
                  strokeDasharray: "3, 2",
                },
              }}
              label={yLabel}
              offsetX={
                isNil(yLabel) ? chartWidth + 5 : chartWidth - TICK_FONT_SIZE + 5
              }
              orientation={"left"}
              axisLabelComponent={<VictoryLabel x={chartWidth} />}
            />
            {/* X axis */}
            <VictoryPortal>
              <VictoryAxis
                tickValues={xScale.ticks}
                tickFormat={
                  hideCP || isCursorActive ? () => "" : xScale.tickFormat
                }
                tickLabelComponent={
                  <XTickLabel
                    chartWidth={chartWidth}
                    withCursor={!!onCursorChange}
                    fontSize={tickLabelFontSize as number}
                    dx={isEmbedded ? 16 : 0}
                  />
                }
                style={{
                  ticks: {
                    stroke: "transparent",
                  },
                  axis: {
                    stroke: "transparent",
                  },
                  tickLabels: {
                    fontFamily: LABEL_FONT_FAMILY,
                    padding: 5,
                    fontSize: tickLabelFontSize,
                    fill: getThemeColor(METAC_COLORS.gray["700"]),
                  },
                }}
              />
            </VictoryPortal>
            {/* Background line */}
            {graphs.map(({ line, color, active }, index) =>
              active ? (
                <VictoryLine
                  key={`group-bg-line-${index}`}
                  data={line}
                  style={{
                    data: {
                      stroke: getThemeColor(color),
                      strokeOpacity: 0.2,
                      strokeWidth: 1.5,
                    },
                  }}
                  interpolation="stepAfter"
                />
              ) : null
            )}
            {/* Main line */}
            {graphs.map(({ color, active, highlighted }, index) => {
              const filteredLine = filteredLines[index];
              if (!active || !filteredLine) return null;
              return (
                <VictoryLine
                  key={`group-main-line-${index}`}
                  data={filteredLine}
                  style={{
                    data: {
                      stroke: getThemeColor(color),
                      strokeOpacity: !isHighlightActive
                        ? baseLineOpacity
                        : highlighted
                          ? 1
                          : 0.3,
                      strokeWidth: 1.5,
                    },
                  }}
                  interpolation="stepAfter"
                />
              );
            })}
            {/* Line cursor points */}
            {graphs.map(
              ({ color, active, line, highlighted, isClosed }, index) => {
                const filteredLine = filteredLines[index];
                const point = onCursorChange
                  ? filteredLine?.at(-1)
                  : {
                      x: isClosed
                        ? line?.at(-1)?.x ?? Number(xDomain[1])
                        : Number(xDomain[1]),
                      y: line?.at(-1)?.y ?? 0,
                    };
                if (
                  !active ||
                  !filteredLine ||
                  !point ||
                  (!forceShowLinePoints &&
                    (isHighlightActive ||
                      !isCursorActive ||
                      (cursorTimestamp && point.x < cursorTimestamp)))
                ) {
                  return null;
                }

                return (
                  <VictoryScatter
                    key={`group-line-point-${index}`}
                    data={[point]}
                    style={{
                      data: {
                        stroke: getThemeColor(color),
                        strokeOpacity: !isHighlightActive
                          ? 1
                          : highlighted
                            ? 1
                            : 0.3,
                        strokeWidth: 2,
                        fill: getThemeColor(color),
                      },
                    }}
                  />
                );
              }
            )}
            {/* Highlighted line area */}
            {graphs.map(({ area, color, highlighted, active }, index) =>
              active ? (
                <VictoryArea
                  key={`group-area-${index}`}
                  data={area}
                  style={{
                    data: {
                      fill: getThemeColor(color),
                      opacity: highlighted ? 0.3 : 0,
                    },
                  }}
                  interpolation="stepAfter"
                />
              ) : null
            )}
            {/* Resolution point */}
            {graphs.map(({ color, active, resolutionPoint }, index) => {
              if (!resolutionPoint || !active) return null;

              const textThemeColor =
                color === METAC_COLORS["mc-option"][1]
                  ? METAC_COLORS["mc-option-text"][1]
                  : color;

              if (
                resolutionPoint.placement &&
                ["below", "above"].includes(resolutionPoint.placement)
              ) {
                return (
                  <VictoryPortal key={`group-resolution-portal-${index}`}>
                    <VictoryScatter
                      key={`group-resolution-${index}`}
                      data={[
                        {
                          x: resolutionPoint?.x,
                          y: resolutionPoint?.placement === "below" ? 0 : 1,
                          x1: resolutionPoint?.x1,
                          y1: resolutionPoint?.y1,
                          text: resolutionPoint?.text,
                          placement: resolutionPoint?.placement,
                          primary: color,
                        },
                      ]}
                      dataComponent={<ResolutionDiamond hoverable={false} />}
                    />
                  </VictoryPortal>
                );
              }

              return (
                <VictoryScatter
                  key={`group-resolution-${index}`}
                  data={[
                    {
                      x: resolutionPoint?.x,
                      y: resolutionPoint?.y,
                      x1: resolutionPoint?.x1,
                      y1: resolutionPoint?.y1,
                      text: resolutionPoint?.text,
                      symbol: "diamond",
                      size: POINT_SIZE,
                    },
                  ]}
                  style={{
                    data: {
                      stroke: getThemeColor(color),
                      fill: getThemeColor(METAC_COLORS.gray["200"]),
                      strokeWidth: 2.5,
                    },
                  }}
                  dataComponent={
                    <GroupResolutionPoint
                      pointColor={getThemeColor(color)}
                      pointTextColor={getThemeColor(textThemeColor)}
                      pointSize={POINT_SIZE}
                      chartWidth={chartWidth}
                      chartRightPadding={maxRightPadding}
                    />
                  }
                />
              );
            })}
            {/* User predictions */}
            {graphs.map(({ active, scatter, color, highlighted }, index) =>
              active && (!isHighlightActive || highlighted) ? (
                <VictoryScatter
                  key={`group-scatter-${index}`}
                  data={scatter}
                  dataComponent={
                    <PredictionSymbol
                      size={USER_POINT_SIZE}
                      strokeWidth={USER_POINT_STROKE}
                    />
                  }
                  style={{
                    data: {
                      stroke: getThemeColor(color),
                      fill: getThemeColor(METAC_COLORS.gray["200"]),
                      strokeWidth: USER_POINT_STROKE,
                    },
                  }}
                />
              ) : null
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
  area?: Area;
  scatter?: Line;
  resolutionPoint?: {
    x?: number;
    y: number;
    text?: string;
    x1?: number;
    y1?: number;
    placement?: "in" | "below" | "above";
  };
  choice: string;
  color: ThemeColor;
  active: boolean;
  highlighted: boolean;
  isClosed?: boolean;
};
type ChartData = BaseChartData & {
  graphs: ChoiceGraph[];
  xDomain: DomainTuple;
  yDomain: DomainTuple;
};

function buildChartData({
  height,
  width,
  choiceItems,
  timestamps,
  actualCloseTime,
  zoom,
  questionType,
  scaling,
  aggregation,
  extraTheme,
  hideCP,
  isAggregationsEmpty,
  openTime,
  forceAutoZoom,
  forFeedPage,
  isEmbedded,
}: {
  timestamps: number[];
  actualCloseTime?: number | null;
  choiceItems: ChoiceItem[];
  width: number;
  height: number;
  zoom: TimelineChartZoomOption;
  questionType: QuestionType;
  scaling?: Scaling;
  aggregation?: boolean;
  extraTheme?: VictoryThemeDefinition;
  hideCP?: boolean;
  isAggregationsEmpty?: boolean;
  openTime?: number | null;
  forceAutoZoom?: boolean;
  forFeedPage?: boolean;
  isEmbedded?: boolean;
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

  const graphs: ChoiceGraph[] = choiceItems.map(
    ({
      choice,
      aggregationTimestamps,
      aggregationValues,
      aggregationMinValues,
      aggregationMaxValues,
      userTimestamps,
      userValues,
      userMaxValues,
      userMinValues,
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
      const area: Area = [];

      userTimestamps.forEach((timestamp, timestampIndex) => {
        const userValue = userValues[timestampIndex];
        const userMaxValue = userMaxValues
          ? userMaxValues[timestampIndex]
          : null;
        const userMinValue = userMinValues
          ? userMinValues[timestampIndex]
          : null;
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
            y1: userMinValue ? rescale(userMinValue) : null,
            y2: userMaxValue ? rescale(userMaxValue) : null,
            symbol: "circle",
          });
        } else {
          // we have a null value while previous was real
          const lastScatterItem = scatter.at(-1);
          if (!isNil(lastScatterItem)) {
            scatter.push({
              x: timestamp,
              y: lastScatterItem.y,
              y1: lastScatterItem.y1,
              y2: lastScatterItem.y2,
              symbol: "x",
            });
          }

          scatter.push({
            x: timestamp,
            y: null,
            y1: null,
            y2: null,
            symbol: "circle",
          });
        }
      });
      if (!hideCP) {
        aggregationTimestamps.forEach((timestamp, timestampIndex) => {
          const aggregationValue = aggregationValues[timestampIndex];
          const aggregationMinValue = aggregationMinValues[timestampIndex];
          const aggregationMaxValue = aggregationMaxValues[timestampIndex];
          // build line and area (CP data)
          if (
            !line.length ||
            !isNil(aggregationValue) ||
            isNil(line[line.length - 1]?.y)
          ) {
            // we are either starting or have a real value or previous value is null
            line.push({
              x: timestamp,
              y: !isNil(aggregationValue) ? rescale(aggregationValue) : null,
            });

            area.push({
              x: timestamp,
              y: !isNil(aggregationMaxValue)
                ? rescale(aggregationMaxValue)
                : null,
              y0: !isNil(aggregationMinValue)
                ? rescale(aggregationMinValue)
                : null,
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
            const lastAreaItem = area.at(-1);
            if (!isNil(lastAreaItem)) {
              area.push({
                x: timestamp,
                y: lastAreaItem.y,
                y0: lastAreaItem.y0,
              });
            }

            line.push({
              x: timestamp,
              y: null,
            });
            area.push({
              x: timestamp,
              y: null,
              y0: null,
            });
          }
        });
      }

      const item: ChoiceGraph = {
        choice,
        color,
        line: line,
        area: area,
        scatter: scatter,
        active,
        highlighted,
        isClosed: closeTime ? new Date(closeTime) < new Date() : false,
      };
      if (item.line.length > 0) {
        item.line.push({
          x: closeTime ? closeTime / 1000 : latestTimestamp,
          y: item.line.at(-1)?.y ?? null,
        });
        item.area?.push({
          x: closeTime ? closeTime / 1000 : latestTimestamp,
          y: item?.area?.at(-1)?.y ?? null,
          y0: item?.area?.at(-1)?.y0 ?? null,
        });
      }
      if (!isNil(resolution)) {
        const lastLineItem = item.line.at(-1);
        const resolveTime = closeTime ? closeTime / 1000 : latestTimestamp;
        if (
          ["yes", "no", "below_lower_bound", "above_upper_bound"].includes(
            resolution as string
          )
        ) {
          // binary group and out of borders cases
          let text = undefined;
          switch (resolution) {
            case "no":
              text = "No";
              break;
            case "yes":
              text = "Yes";
          }

          item.resolutionPoint = {
            x: resolveTime,
            y:
              resolution === "no" || resolution === "below_lower_bound" ? 0 : 1,
            text,
            x1: lastLineItem?.x,
            y1: lastLineItem?.y ?? undefined,
            placement:
              resolution === "below_lower_bound"
                ? "below"
                : resolution === "above_upper_bound"
                  ? "above"
                  : "in",
          };
        }

        if (isFinite(Number(resolution))) {
          const yPos = scaling
            ? unscaleNominalLocation(Number(resolution), scaling)
            : Number(resolution) ?? 0;
          // continuous group case
          item.resolutionPoint = {
            x: resolveTime,
            y: yPos,
            x1: lastLineItem?.x,
            y1: lastLineItem?.y ?? undefined,
            placement: yPos < 0 ? "below" : yPos > 1 ? "above" : "in",
          };
        } else if (
          typeof resolution === "string" &&
          // date question case
          isFinite(Number(Date.parse(resolution))) &&
          !isNil(scaling)
        ) {
          const dateResolution = getResolutionPoint({
            questionType: QuestionType.Date,
            resolution,
            resolveTime,
            scaling,
          });

          if (dateResolution) {
            const yPos = dateResolution.y ?? 0;
            item.resolutionPoint = {
              x: dateResolution.x,
              y: yPos,
              placement: yPos < 0 ? "below" : yPos > 1 ? "above" : "in",
              x1: lastLineItem?.x,
              y1: lastLineItem?.y ?? undefined,
            };
          }
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

  // @ts-expect-error we manually check, that areas are not nullable, this should be fixed on later ts versions
  const areas: Area = graphs
    .filter((g) => !isNil(g.area) && g.active)
    .flatMap((g) => g.area);
  const { originalYDomain, zoomedYDomain } = generateTimeSeriesYDomain({
    zoom,
    minTimestamp: xDomain[0],
    isChartEmpty: !domainTimestamps.length,
    minValues: areas.map((a) => ({ timestamp: a.x, y: a.y0 })),
    maxValues: areas.map((a) => ({ timestamp: a.x, y: a.y })),
    includeClosestBoundOnZoom: questionType === QuestionType.Binary,
    forceAutoZoom,
  });

  const yScale = generateScale({
    displayType: questionType,
    axisLength: height,
    direction: ScaleDirection.Vertical,
    scaling: scaling,
    domain: originalYDomain,
    zoomedDomain: zoomedYDomain,
    forceTickCount: isEmbedded ? 5 : forFeedPage ? 3 : 5,
    alwaysShowTicks: true,
  });

  return { xScale, yScale, graphs, xDomain, yDomain: zoomedYDomain };
}

// Define a custom "X" symbol function
type SymbolProps = PointProps & { size?: number; strokeWidth?: number };
const PredictionSymbol: React.FC<SymbolProps> = (props) => {
  const { getThemeColor } = useAppTheme();
  const { x, y, datum, size = 6, style, strokeWidth = 1.5 } = props;
  if (
    typeof x !== "number" ||
    typeof y !== "number" ||
    typeof size !== "number"
  ) {
    return null;
  }
  const symbol = datum.symbol;
  const stroke = style.stroke;

  if (symbol === "x") {
    return (
      <g>
        <line
          x1={x - size}
          y1={y - size}
          x2={x + size}
          y2={y + size}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
        <line
          x1={x - size}
          y1={y + size}
          x2={x + size}
          y2={y - size}
          stroke={stroke}
          strokeWidth={strokeWidth}
        />
      </g>
    );
  }

  return (
    <circle
      cx={x}
      cy={y}
      r={size / 2 + 1}
      stroke={stroke}
      fill={getThemeColor(METAC_COLORS.gray["200"])}
      strokeWidth={strokeWidth}
    />
  );
};

export default memo(GroupChart);
