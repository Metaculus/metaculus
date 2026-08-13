"use client";

import { isNil, merge } from "lodash";
import { useTranslations } from "next-intl";
import React, {
  FC,
  memo,
  ReactNode,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  CursorCoordinatesPropType,
  DomainTuple,
  LineSegment,
  PointProps,
  Tuple,
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

import { CHART_DASH } from "@/constants/chart_dash";
import { CHART_STROKE_WIDTH } from "@/constants/chart_stroke";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { CHART_FONT_STYLE } from "@/constants/chart_typography";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import usePrevious from "@/hooks/use_previous";
import {
  Area,
  BaseChartData,
  DEFAULT_TIMELINE_Y_DOMAIN_OPTIONS,
  Line,
  ScaleDirection,
  TickFormat,
  TimelineChartZoomOption,
  TimelineYDomainOptions,
  TimelineYDomainSource,
  resolveTimelineYDomainOptions,
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
  restrictScaleTicksToDomain,
  widenDomainToTicks,
  Y_AXIS_LABEL_ANCHOR_OFFSET,
  Y_AXIS_LABEL_RESERVED_PX,
} from "@/utils/charts/axis";
import { getResolutionPoint } from "@/utils/charts/resolution";
import {
  reduceStepAreaSegments,
  reduceStepLineSegments,
} from "@/utils/charts/step_reducer";
import { scaleInternalLocation, unscaleNominalLocation } from "@/utils/math";

import ForecastAvailabilityChartOverflow from "../post_card/chart_overflow";
import ChartContainer from "./primitives/chart_container";
import ChartCursorLabel from "./primitives/chart_cursor_label";
import GroupResolutionPoint from "./primitives/group_resolution_point";
import ResolutionDiamond from "./primitives/resolution_diamond";
import { renderGroupTimelineMarkers } from "./primitives/timeline_markers/group_timeline_markers_overlay";
import { GroupTimelineMarker } from "./primitives/timeline_markers/types";
import XTickLabel from "./primitives/x_tick_label";

type Props = {
  timestamps: number[];
  actualCloseTime?: number | null;
  choiceItems: ChoiceItem[];
  defaultZoom?: TimelineChartZoomOption;
  /** Controlled zoom. Omit to let the chart own it via `defaultZoom`. Lets one
   *  external picker drive several charts at once. */
  zoom?: TimelineChartZoomOption;
  onZoomChange?: (zoom: TimelineChartZoomOption) => void;
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
  cursorTimestamp?: number | null;
  forecastAvailability?: ForecastAvailability;
  forceShowLinePoints?: boolean;
  /** Hide the y-axis tick labels and reclaim the space they reserve. Gridlines
   *  stay. For compact charts that surface their values elsewhere. */
  hideYAxis?: boolean;
  /** Hide the x-axis tick labels permanently, not just while the cursor is
   *  active. Pair with `showCursorLabel` so the hovered date is the only x value
   *  ever shown. */
  hideXAxis?: boolean;
  forFeedPage?: boolean;
  isEmbedded?: boolean;
  chartTitle?: ReactNode;
  headerExtra?: ReactNode;
  showCursorLabel?: boolean;
  fadeLinesOnHover?: boolean;
  timelineMarkers?: GroupTimelineMarker[];
  activeTimelineMarkerId?: string | null;
  onTimelineMarkerEnter?: (marker: GroupTimelineMarker) => void;
  onTimelineMarkerLeave?: (marker: GroupTimelineMarker) => void;
  animate?: object;
  leftPadding?: number;
  withHighlightArea?: boolean;
  withHighlightEndpoint?: boolean;
  headerLeft?: ReactNode;
  yDomainOptions?: TimelineYDomainOptions;
  /** Let binary questions use the computed zoomed y-domain instead of the fixed
   *  [0, 1]. Off by default: platform-wide, a binary timeline is read against a
   *  full probability axis, and shrinking it silently would overstate movement.
   *  Opt in where the values are surfaced numerically elsewhere. */
  binaryYZoom?: boolean;
  /** Floor on the zoomed domain's height, in probability units. Guards the
   *  degenerate case: `generateYDomain` falls back to a ±1pp window when the
   *  visible span is zero, which would draw sampling noise as a swing. */
  minYSpan?: number;
};

const BOTTOM_PADDING = 20;
// Endpoint-dot clearance used in place of the y-label allowance when hideYAxis is
// set — matches the SCATTER_POINT_PADDING that getAxisRightPadding adds for the
// same dot, plus a pixel for its stroke.
const HIDDEN_Y_AXIS_RIGHT_PADDING = 6;
const POINT_SIZE = 9;
const USER_POINT_SIZE = 6;
const USER_POINT_STROKE = CHART_STROKE_WIDTH.userPoint;
const PLOT_TOP = 10;

const GroupChart: FC<Props> = ({
  timestamps,
  actualCloseTime,
  choiceItems,
  defaultZoom = TimelineChartZoomOption.All,
  zoom: controlledZoom,
  onZoomChange,
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
  cursorTimestamp,
  forecastAvailability,
  forceShowLinePoints = false,
  hideYAxis = false,
  hideXAxis = false,
  forFeedPage,
  isEmbedded = false,
  chartTitle,
  headerExtra,
  showCursorLabel = true,
  fadeLinesOnHover = true,
  timelineMarkers,
  activeTimelineMarkerId,
  onTimelineMarkerEnter,
  onTimelineMarkerLeave,
  animate,
  leftPadding = 0,
  withHighlightArea = true,
  withHighlightEndpoint = false,
  headerLeft,
  yDomainOptions,
  binaryYZoom = false,
  minYSpan,
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
        ? !isNil(actualCloseTime)
          ? actualCloseTime / 1000
          : timestamps[timestamps.length - 1]
        : Date.now() / 1000,
    [actualCloseTime, isClosed, timestamps]
  );
  const [isCursorActive, setIsCursorActive] = useState(false);

  // Controlled/uncontrolled: an external picker can own the zoom, otherwise the
  // chart keeps its own.
  const [internalZoom, setInternalZoom] =
    useState<TimelineChartZoomOption>(defaultZoom);
  // Mirror the controlled value so nothing jumps if a caller stops controlling
  // mid-life. Without this, internal state only saw changes made through the
  // chart's own picker, so a parent that drives zoom from elsewhere would leave
  // it at `defaultZoom` and the chart would snap back to that on release.
  useEffect(() => {
    if (!isNil(controlledZoom)) {
      setInternalZoom(controlledZoom);
    }
  }, [controlledZoom]);
  const zoom = controlledZoom ?? internalZoom;
  const handleZoomChange = (next: TimelineChartZoomOption) => {
    setInternalZoom(next);
    onZoomChange?.(next);
  };
  const [yDomainSource, setYDomainSource] = useState<TimelineYDomainSource>(
    yDomainOptions?.source ?? DEFAULT_TIMELINE_Y_DOMAIN_OPTIONS.source
  );
  useEffect(
    () =>
      setYDomainSource(
        yDomainOptions?.source ?? DEFAULT_TIMELINE_Y_DOMAIN_OPTIONS.source
      ),
    [yDomainOptions?.source]
  );
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
        forFeedPage,
        yDomainOptions: {
          ...yDomainOptions,
          source: yDomainSource,
        },
        binaryYZoom,
        minYSpan,
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
      forFeedPage,
      yDomainOptions,
      yDomainSource,
      binaryYZoom,
      minYSpan,
    ]
  );
  const [localCursorTimestamp, setLocalCursorTimestamp] = useState<
    number | null
  >(null);
  const effectiveCursorTimestamp = !isNil(cursorTimestamp)
    ? cursorTimestamp
    : localCursorTimestamp;
  const filteredLines = useMemo(() => {
    return graphs.map(({ line, active }) => {
      const lastLineX = line.at(-1)?.x;
      if (!active || isNil(lastLineX)) return null;

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
    // MIN_RIGHT_PADDING (35px) exists to fit y-axis tick labels. With them hidden
    // that space is dead, and it reads as lopsided padding against a container
    // whose own padding is symmetric. Keep only what the line's endpoint dot
    // needs to sit fully inside the plot.
    if (hideYAxis) return HIDDEN_Y_AXIS_RIGHT_PADDING;
    return Math.max(rightPadding, MIN_RIGHT_PADDING);
  }, [hideYAxis, rightPadding, MIN_RIGHT_PADDING]);
  const chartPadding = useMemo(
    () => ({
      left: leftPadding,
      top: PLOT_TOP,
      right: maxRightPadding,
      bottom: isEmbedded ? BOTTOM_PADDING - 6 : BOTTOM_PADDING,
    }),
    [isEmbedded, maxRightPadding, leftPadding]
  );
  const plotBottom = height - chartPadding.bottom;

  const isHighlightActive = useMemo(
    () => Object.values(choiceItems).some(({ highlighted }) => highlighted),
    [choiceItems]
  );
  const hasUserForecasts = useMemo(
    () => choiceItems.some(({ userTimestamps }) => userTimestamps.length > 0),
    [choiceItems]
  );

  const prevWidth = usePrevious(chartWidth);
  const isMarkerHovered = !isNil(activeTimelineMarkerId);
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

  const canUseCursor =
    !!onCursorChange && !hideCP && !forecastAvailability?.cpRevealsOn;

  const CursorContainer = (
    <VictoryCursorContainer
      containerRef={attachRef}
      cursorDimension={"x"}
      defaultCursorValue={defaultCursor}
      style={{
        touchAction: "none",
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
                  strokeDasharray: CHART_DASH.cursor,
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

        if (onCursorChange && !isMarkerHovered) {
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
        onZoomChange={handleZoomChange}
        yDomainSource={
          withZoomPicker && questionType !== QuestionType.Binary
            ? yDomainSource
            : undefined
        }
        onYDomainSourceChange={
          withZoomPicker && questionType !== QuestionType.Binary
            ? setYDomainSource
            : undefined
        }
        chartTitle={chartTitle}
        headerLeft={headerLeft}
        headerExtra={headerExtra}
      >
        {!!chartWidth && (
          <div
            className="relative h-full"
            onMouseLeave={() => {
              if (!onCursorChange) return;
              inPlotRef.current = false;
              setIsCursorActive(false);
              setLocalCursorTimestamp(null);
              if (!isNil(defaultCursor)) {
                onCursorChange(defaultCursor, xScale.tickFormat);
              }
            }}
          >
            <VictoryChart
              width={chartWidth}
              height={height}
              theme={actualTheme}
              domainPadding={{ y: 3 }}
              singleQuadrantDomainPadding={{ y: false }}
              padding={chartPadding}
              animate={animate}
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
                      const wasInPlot = inPlotRef.current;
                      inPlotRef.current = inPlot;
                      setIsCursorActive(inPlot);
                      if (!inPlot) {
                        setLocalCursorTimestamp(null);
                        if (wasInPlot && !isNil(defaultCursor)) {
                          onCursorChange(defaultCursor, xScale.tickFormat);
                        }
                      }
                    },
                    onMouseLeave: () => {
                      inPlotRef.current = false;
                      setIsCursorActive(false);
                      setLocalCursorTimestamp(null);
                      // Reset to rendered endpoint, not last raw data point.
                      if (onCursorChange) {
                        onCursorChange(
                          defaultCursor ?? Number(xDomain[1]),
                          () => ""
                        );
                      }
                    },
                    // Victory doesn't fire cursor events on touch, so we manually compute the timestamp from touch position.
                    onTouchStartCapture: (e: React.SyntheticEvent) => {
                      if (!canUseCursor) return;
                      const touch = (e as React.TouchEvent).touches[0];
                      if (!touch) return;
                      const svg =
                        (e.currentTarget as SVGElement).ownerSVGElement ??
                        e.currentTarget;
                      const rect = (svg as SVGElement).getBoundingClientRect();
                      const x = touch.clientX - rect.left;
                      const y = touch.clientY - rect.top;
                      const inPlot =
                        x >= 0 &&
                        x <= chartWidth - maxRightPadding &&
                        y >= PLOT_TOP &&
                        y <= plotBottom;
                      inPlotRef.current = inPlot;
                      setIsCursorActive(inPlot);
                      if (inPlot) {
                        const ts = pixelXToTimestamp(
                          x,
                          xDomain,
                          chartWidth,
                          leftPadding,
                          maxRightPadding
                        );
                        setLocalCursorTimestamp(ts);
                        if (!isMarkerHovered) {
                          onCursorChange?.(ts, xScale.tickFormat);
                        }
                      }
                    },
                    onTouchMoveCapture: (e: React.SyntheticEvent) => {
                      if (!canUseCursor) return;
                      const touch = (e as React.TouchEvent).touches[0];
                      if (!touch) return;
                      const svg =
                        (e.currentTarget as SVGElement).ownerSVGElement ??
                        e.currentTarget;
                      const rect = (svg as SVGElement).getBoundingClientRect();
                      const x = touch.clientX - rect.left;
                      const y = touch.clientY - rect.top;
                      const inPlot =
                        x >= 0 &&
                        x <= chartWidth - maxRightPadding &&
                        y >= PLOT_TOP &&
                        y <= plotBottom;
                      inPlotRef.current = inPlot;
                      setIsCursorActive(inPlot);
                      if (inPlot) {
                        const ts = pixelXToTimestamp(
                          x,
                          xDomain,
                          chartWidth,
                          leftPadding,
                          maxRightPadding
                        );
                        setLocalCursorTimestamp(ts);
                        if (!isMarkerHovered) {
                          onCursorChange?.(ts, xScale.tickFormat);
                        }
                      } else {
                        setLocalCursorTimestamp(null);
                      }
                    },
                    onTouchEnd: () => {
                      inPlotRef.current = false;
                      setIsCursorActive(false);
                      setLocalCursorTimestamp(null);
                      if (onCursorChange) {
                        onCursorChange(
                          defaultCursor ?? Number(xDomain[1]),
                          () => ""
                        );
                      }
                    },
                    onTouchCancel: () => {
                      inPlotRef.current = false;
                      setIsCursorActive(false);
                      setLocalCursorTimestamp(null);
                      if (onCursorChange) {
                        onCursorChange(
                          defaultCursor ?? Number(xDomain[1]),
                          () => ""
                        );
                      }
                    },
                  },
                },
              ]}
              containerComponent={
                canUseCursor ? (
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
                    ...CHART_FONT_STYLE.axisLabel,
                    fontSize: tickLabelFontSize,
                    fill: getThemeColor(METAC_COLORS.gray["500"]),
                  },
                  tickLabels: {
                    ...CHART_FONT_STYLE.tick,
                    // Right-align labels at the right margin, reserving space
                    // for the rotated yLabel when present.
                    padding:
                      maxRightPadding -
                      (yLabel ? Y_AXIS_LABEL_RESERVED_PX : 0) -
                      4,
                    textAnchor: "end",
                    fontSize: tickLabelFontSize,
                    fill: hideYAxis
                      ? "transparent"
                      : getThemeColor(METAC_COLORS.gray["700"]),
                  },
                  axis: {
                    stroke: "transparent",
                  },
                  grid: {
                    stroke: getThemeColor(METAC_COLORS.gray["400"]),
                    strokeWidth: CHART_STROKE_WIDTH.grid,
                    strokeDasharray: CHART_DASH.grid,
                  },
                }}
                label={yLabel}
                orientation="right"
                axisLabelComponent={
                  yLabel ? (
                    <VictoryLabel x={chartWidth - Y_AXIS_LABEL_ANCHOR_OFFSET} />
                  ) : undefined
                }
              />
              {/* X axis */}
              <VictoryPortal>
                <VictoryAxis
                  tickValues={xScale.ticks}
                  tickFormat={
                    hideXAxis || (hideCP && !hasUserForecasts) || isCursorActive
                      ? () => ""
                      : xScale.tickFormat
                  }
                  tickLabelComponent={
                    <XTickLabel
                      chartWidth={chartWidth}
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
                      ...CHART_FONT_STYLE.tick,
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
                        strokeWidth: CHART_STROKE_WIDTH.forecastLine,
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
                        strokeWidth:
                          isHighlightActive && highlighted
                            ? 3
                            : CHART_STROKE_WIDTH.forecastLine,
                      },
                    }}
                    interpolation="stepAfter"
                  />
                );
              })}
              {/* Line endpoint dot */}
              {withHighlightEndpoint &&
                graphs.map(
                  ({ color, active, line, highlighted, isClosed }, index) => {
                    if (!active) return null;
                    const filteredLine = filteredLines[index];
                    if (!filteredLine) return null;
                    const lastY = line?.at(-1)?.y;
                    if (isNil(lastY)) return null; // skip marker if last CP value is null — avoids fake dot on baseline
                    const point = {
                      x: isClosed
                        ? line?.at(-1)?.x ?? Number(xDomain[1])
                        : Number(xDomain[1]),
                      y: lastY,
                    };
                    return (
                      <VictoryScatter
                        key={`group-endpoint-${index}`}
                        data={[point]}
                        size={4}
                        style={{
                          data: {
                            fill: getThemeColor(color),
                            fillOpacity: !isHighlightActive
                              ? baseLineOpacity
                              : highlighted
                                ? 1
                                : 0.3,
                          },
                        }}
                      />
                    );
                  }
                )}
              {/* Line cursor points */}
              {graphs.map(
                ({ color, active, line, highlighted, isClosed }, index) => {
                  const filteredLine = filteredLines[index];
                  const lastY = line?.at(-1)?.y;
                  const endpointPoint = isNil(lastY)
                    ? null
                    : {
                        x: isClosed
                          ? line?.at(-1)?.x ?? Number(xDomain[1])
                          : Number(xDomain[1]),
                        y: lastY,
                      };
                  // When not hovering, pin dot to line endpoint (avoids null-y cursor-extension points hiding the dot).
                  const point =
                    forceShowLinePoints && !isCursorActive
                      ? endpointPoint
                      : onCursorChange
                        ? filteredLine?.at(-1)
                        : endpointPoint;
                  if (
                    !active ||
                    !filteredLine ||
                    !point ||
                    (!forceShowLinePoints &&
                      (isHighlightActive ||
                        (!isNil(cursorTimestamp) && point.x < cursorTimestamp)))
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
                          strokeWidth: CHART_STROKE_WIDTH.predictionRange,
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
                        opacity: withHighlightArea && highlighted ? 0.3 : 0,
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
                        strokeWidth: CHART_STROKE_WIDTH.resolutionDiamond,
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
              {/* Timeline markers */}
              {timelineMarkers?.length
                ? renderGroupTimelineMarkers({
                    markers: timelineMarkers,
                    yDomain: yDomain as [number, number],
                    getThemeColor,
                    activeMarkerId: activeTimelineMarkerId,
                    onMarkerEnter: onTimelineMarkerEnter,
                    onMarkerLeave: onTimelineMarkerLeave,
                  })
                : null}
            </VictoryChart>
          </div>
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

function pixelXToTimestamp(
  x: number,
  xDomain: DomainTuple,
  chartWidth: number,
  leftPadding: number,
  rightPadding: number
): number {
  const plotWidth = chartWidth - rightPadding - leftPadding;
  if (plotWidth <= 0) return Number(xDomain[0]);
  const ratio = Math.max(0, Math.min(1, (x - leftPadding) / plotWidth));
  return Number(xDomain[0]) + ratio * (Number(xDomain[1]) - Number(xDomain[0]));
}

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
  forFeedPage,
  isEmbedded,
  yDomainOptions,
  binaryYZoom,
  minYSpan,
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
  forFeedPage?: boolean;
  isEmbedded?: boolean;
  yDomainOptions?: TimelineYDomainOptions;
  binaryYZoom?: boolean;
  minYSpan?: number;
}): ChartData {
  const closeTimes = choiceItems
    .map(({ closeTime }) => closeTime)
    .filter((t): t is number => !isNil(t));
  const latestTimestamp = !isNil(actualCloseTime)
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
        const userMaxValue = !isNil(userMaxValues)
          ? userMaxValues[timestampIndex]
          : null;
        const userMinValue = !isNil(userMinValues)
          ? userMinValues[timestampIndex]
          : null;
        // build user scatter points
        if (
          !scatter.length ||
          !isNil(userValue) ||
          isNil(scatter[scatter.length - 1]?.y)
        ) {
          // we are either starting or have a real value or previous value is null
          scatter.push({
            x: timestamp,
            y: !isNil(userValue) ? rescale(userValue) : null,
            y1: !isNil(userMinValue) ? rescale(userMinValue) : null,
            y2: !isNil(userMaxValue) ? rescale(userMaxValue) : null,
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
        line: forFeedPage ? reduceStepLineSegments(line) : line,
        area: forFeedPage ? reduceStepAreaSegments(area) : area,
        scatter: scatter,
        active,
        highlighted,
        isClosed: !isNil(closeTime) ? new Date(closeTime) < new Date() : false,
      };
      if (item.line.length > 0) {
        item.line.push({
          x: !isNil(closeTime) ? closeTime / 1000 : latestTimestamp,
          y: item.line.at(-1)?.y ?? null,
        });
        item.area?.push({
          x: !isNil(closeTime) ? closeTime / 1000 : latestTimestamp,
          y: item?.area?.at(-1)?.y ?? null,
          y0: item?.area?.at(-1)?.y0 ?? null,
        });
      }
      if (!isNil(resolution)) {
        const lastLineItem = item.line.at(-1);
        const resolveTime = !isNil(closeTime)
          ? closeTime / 1000
          : latestTimestamp;
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
    isAggregationsEmpty && !isNil(openTime)
      ? [openTime / 1000, latestTimestamp]
      : aggregation
        ? timestamps
        : [...timestamps, latestTimestamp];

  const xDomain = generateNumericXDomain(domainTimestamps, zoom);
  const fontSize = extraTheme ? getTickLabelFontSize(extraTheme) : undefined;
  const xScale = generateTimestampXScale(xDomain, width, fontSize);

  const activeGraphs = graphs.filter((g) => g.active);
  const communityCenterSources = activeGraphs.map((graph) => {
    const values = graph.line.map((point) => ({
      timestamp: point.x,
      y: point.y,
    }));
    return {
      minValues: values,
      maxValues: values,
      carryForward: true,
    };
  });
  const communityIntervalSources = activeGraphs.map((graph) => ({
    minValues: (graph.area ?? []).map((point) => ({
      timestamp: point.x,
      y: point.y0,
    })),
    maxValues: (graph.area ?? []).map((point) => ({
      timestamp: point.x,
      y: point.y,
    })),
    carryForward: true,
  }));
  const scatterCenterSources = activeGraphs.map((graph) => {
    const values = (graph.scatter ?? []).map((point) => ({
      timestamp: point.x,
      y: point.y,
    }));
    return {
      minValues: values,
      maxValues: values,
    };
  });
  const scatterIntervalSources = activeGraphs.map((graph) => ({
    minValues: (graph.scatter ?? []).map((point) => ({
      timestamp: point.x,
      y: point.y1 ?? point.y,
    })),
    maxValues: (graph.scatter ?? []).map((point) => ({
      timestamp: point.x,
      y: point.y2 ?? point.y,
    })),
  }));
  const resolutionSources = activeGraphs.flatMap((graph) => {
    if (isNil(graph.resolutionPoint)) return [];
    const values = [
      {
        timestamp: graph.resolutionPoint.x ?? latestTimestamp,
        y: graph.resolutionPoint.y,
      },
    ];
    return [{ minValues: values, maxValues: values }];
  });
  const effectiveYDomainOptions = resolveTimelineYDomainOptions(yDomainOptions);
  const useCenterValues = effectiveYDomainOptions.source === "centers";
  const domainSources = useCenterValues
    ? [...communityCenterSources, ...scatterCenterSources, ...resolutionSources]
    : [
        ...communityIntervalSources,
        // Keep medians as a fallback for histories without interval bounds.
        ...communityCenterSources,
        ...scatterIntervalSources,
        ...resolutionSources,
      ];
  const useFullYDomain = effectiveYDomainOptions.scope === "fullHistory";
  const generatedYDomain = generateTimeSeriesYDomain({
    sources: domainSources,
    timeRange: xDomain,
    isChartEmpty: !domainTimestamps.length,
    useFullYDomain,
    paddingRatio: effectiveYDomainOptions.paddingRatio,
  });
  const { originalYDomain, tickCoverageDomain } = generatedYDomain;
  // Binary questions default to the full [0, 1] axis regardless of how little the
  // forecast moves; `binaryYZoom` opts a chart out of that.
  const zoomedYDomain =
    questionType === QuestionType.Binary && !binaryYZoom
      ? originalYDomain
      : expandDomainToMinSpan(generatedYDomain.zoomedYDomain, minYSpan);

  const yScale = generateScale({
    displayType: questionType,
    axisLength: height,
    direction: ScaleDirection.Vertical,
    scaling: scaling,
    domain: originalYDomain,
    zoomedDomain: zoomedYDomain,
    forceTickCount: isEmbedded ? 5 : forFeedPage ? 3 : 6,
    alwaysShowTicks: true,
    tickCoverageDomain,
  });

  const yDomain = widenDomainToTicks(zoomedYDomain, yScale.ticks);
  const visibleYScale = restrictScaleTicksToDomain(yScale, yDomain);

  return { xScale, yScale: visibleYScale, graphs, xDomain, yDomain };
}

/**
 * Widens a y-domain about its midpoint until it spans at least `minSpan`, so a
 * barely-moving series can't zoom in far enough to render noise as movement.
 * A no-op without `minSpan`, which is how every caller that doesn't opt in
 * leaves it.
 *
 * When the widened window would run past 0 or 1 it slides back inside rather than
 * being clipped: a clipped domain would still be shorter than `minSpan` and so
 * still over-zoomed, which is the thing being guarded against.
 */
function expandDomainToMinSpan(
  domain: Tuple<number>,
  minSpan?: number
): Tuple<number> {
  if (isNil(minSpan) || minSpan <= 0) return domain;
  const [min, max] = domain;
  if (max - min >= minSpan) return domain;

  const target = Math.min(minSpan, 1);
  const mid = (min + max) / 2;
  let lower = mid - target / 2;
  let upper = mid + target / 2;
  if (lower < 0) {
    upper -= lower;
    lower = 0;
  }
  if (upper > 1) {
    lower -= upper - 1;
    upper = 1;
  }
  return [Math.max(0, lower), Math.min(1, upper)];
}

// Define a custom "X" symbol function
type SymbolProps = PointProps & { size?: number; strokeWidth?: number };
const PredictionSymbol: React.FC<SymbolProps> = (props) => {
  const { getThemeColor } = useAppTheme();
  const {
    x,
    y,
    datum,
    size = 6,
    style,
    strokeWidth = CHART_STROKE_WIDTH.userPoint,
  } = props;
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
