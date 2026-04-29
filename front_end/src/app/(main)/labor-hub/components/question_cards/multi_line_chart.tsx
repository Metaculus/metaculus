"use client";

import { faCircleQuestion } from "@fortawesome/free-regular-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { FC, useCallback, useMemo, useState, type MouseEvent } from "react";
import {
  LineSegment,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
} from "victory";

import Tooltip from "@/components/ui/tooltip";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import { usePrintOverride } from "@/contexts/theme_override_context";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import cn from "@/utils/core/cn";
import { pickHighestContrastTextColor } from "@/utils/core/colors";

import {
  CHART_PADDING,
  closestTickValue,
  computeMultiLineChartModel,
  estimateNumericLabelWidthPx,
} from "./chart_core/multi_line_chart_model";
import {
  type DataLabelMode,
  type DataLabelPlacement,
  type LineSeries,
  type MultiLineChartColor,
  type MultiLineChartPoint,
  type MultiLineChartSeries,
  type MultiLineChartYAxisLabel,
} from "./multi_line_chart.types";

type Props = {
  series: MultiLineChartSeries[];
  height?: number;
  yAxisLabels?: MultiLineChartYAxisLabel[];
  showTickLabels?: boolean;
  showLegend?: boolean;
  legendOrder?: string[];
  yAxisGutter?: number;
  formatYTick?: (value: number) => string;
  formatYValue?: (value: number) => string;
  formatXTick?: (value: number) => string;
  highlightedX?: number | null;
  defaultHighlightedX?: number | null;
  onHighlightedXChange?: (value: number | null) => void;
  clearHighlightOnMouseLeave?: boolean;
  emphasizedSeriesId?: string | null;
  historicalForecastDividerX?: number | null;
  /** When false, hides the HISTORICAL / FORECAST labels and the vertical divider line. */
  showHistoricalForecastAnnotation?: boolean;
  /** When true, hides data labels for historical points (those marked filled) while printing. */
  hideHistoricalLabelsInPrint?: boolean;
};

type ResolvedSeriesColors = {
  stroke: string;
  fill: string;
};

type VictoryDatum = MultiLineChartPoint & {
  x: number;
  y: number;
};

type ResolvedSeriesEntry = {
  series: MultiLineChartSeries;
  chartData: VictoryDatum[];
  colors: ResolvedSeriesColors;
  pointRadius: number;
  opacity: number;
  strokeWidth: number;
};

/** Default Y-axis tick labels: whole-number %, explicit + for positives. */
export const defaultFormatYTick = (value: number): string => {
  if (value === 0) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
};

const AREA_SECTION_LABEL_Y = 18;
const X_TICK_AVG_CHAR_PX = 6.5;
const X_TICK_MIN_GAP_PX = 8;

type XTickLabelBox = { left: number; right: number };

type XTickLabelLayoutParams = {
  plotLeft: number;
  plotRight: number;
  xMin: number;
  xMax: number;
  formatXTick?: (value: number) => string;
};

const computeXTickLabelBox = (
  xValue: number,
  { plotLeft, plotRight, xMin, xMax, formatXTick }: XTickLabelLayoutParams
): XTickLabelBox | null => {
  const plotWidth = plotRight - plotLeft;
  const domainSpan = xMax - xMin;
  if (plotWidth <= 0 || domainSpan === 0) return null;
  const text = formatXTick ? formatXTick(xValue) : String(xValue);
  const halfWidth = (text.length * X_TICK_AVG_CHAR_PX) / 2;
  const center = plotLeft + ((xValue - xMin) / domainSpan) * plotWidth;
  return { left: center - halfWidth, right: center + halfWidth };
};

const xTickLabelsCollide = (a: XTickLabelBox, b: XTickLabelBox): boolean =>
  !(
    a.right + X_TICK_MIN_GAP_PX <= b.left ||
    b.right + X_TICK_MIN_GAP_PX <= a.left
  );

const MC_OPTION_COLOR_MAP = {
  mc1: METAC_COLORS["mc-option"]["1"],
  mc2: METAC_COLORS["mc-option"]["2"],
  mc3: METAC_COLORS["mc-option"]["3"],
  mc4: METAC_COLORS["mc-option"]["4"],
  mc5: METAC_COLORS["mc-option"]["5"],
  mc6: METAC_COLORS["mc-option"]["6"],
  mc7: METAC_COLORS["mc-option"]["7"],
  mc8: METAC_COLORS["mc-option"]["8"],
  mc9: METAC_COLORS["mc-option"]["9"],
  mc10: METAC_COLORS["mc-option"]["10"],
  mc11: METAC_COLORS["mc-option"]["11"],
  mc12: METAC_COLORS["mc-option"]["12"],
  mc13: METAC_COLORS["mc-option"]["13"],
  mc14: METAC_COLORS["mc-option"]["14"],
  mc15: METAC_COLORS["mc-option"]["15"],
  mc16: METAC_COLORS["mc-option"]["16"],
  mc17: METAC_COLORS["mc-option"]["17"],
  mc18: METAC_COLORS["mc-option"]["18"],
} as const;

/** Default for point badges: one decimal and %. */
export const defaultFormatYValue = (value: number): string => {
  if (value === 0) return "0.0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

const getSeriesColors = (
  colorType: MultiLineChartColor,
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string
) => {
  if (colorType in MC_OPTION_COLOR_MAP) {
    const fill = getThemeColor(
      MC_OPTION_COLOR_MAP[colorType as keyof typeof MC_OPTION_COLOR_MAP]
    );
    return {
      stroke: fill,
      fill,
    };
  }

  switch (colorType) {
    case "green": {
      const fill = getThemeColor(METAC_COLORS["mc-option"]["3"]);
      return {
        stroke: fill,
        fill,
      };
    }
    case "red": {
      const fill = getThemeColor(METAC_COLORS["mc-option"]["2"]);
      return {
        stroke: fill,
        fill,
      };
    }
    case "blue": {
      const fill = getThemeColor(METAC_COLORS.blue["800"]);
      return {
        stroke: fill,
        fill,
      };
    }
    case "gray":
    default: {
      const fill = getThemeColor(METAC_COLORS.gray["500"]);
      return {
        stroke: fill,
        fill,
      };
    }
  }
};

const Legend: FC<{
  series: MultiLineChartSeries[];
  order?: string[];
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string;
}> = ({ series, order, getThemeColor }) => {
  const legendItems = useMemo(() => {
    const withLabels = series.filter((item) => item.label);
    if (!order) return withLabels;

    return [...withLabels].sort((a, b) => {
      const aIndex = order.indexOf(a.id);
      const bIndex = order.indexOf(b.id);
      if (aIndex === -1 && bIndex === -1) return 0;
      if (aIndex === -1) return 1;
      if (bIndex === -1) return -1;
      return aIndex - bIndex;
    });
  }, [series, order]);

  return (
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2 pr-8">
      {legendItems.map((item) => {
        const colors = getSeriesColors(item.color, getThemeColor);
        return (
          <div key={item.id} className="flex items-center gap-1.5">
            <svg
              width={16}
              height={16}
              className={cn(
                "shrink-0",
                item.legendStyle !== "line" &&
                  !item.filled &&
                  "text-gray-0 dark:text-gray-0-dark"
              )}
            >
              {item.legendStyle === "line" ? (
                <line
                  x1={0}
                  y1={8}
                  x2={16}
                  y2={8}
                  stroke={colors.stroke}
                  strokeWidth={2}
                  strokeDasharray={item.dashed ? "4, 3" : undefined}
                />
              ) : (
                <circle
                  cx={8}
                  cy={8}
                  r={6}
                  fill={item.filled ? colors.fill : "currentColor"}
                  stroke={colors.stroke}
                  strokeWidth={2}
                />
              )}
            </svg>
            <span className="text-xs font-medium text-gray-700 dark:text-gray-700-dark">
              {item.label}
            </span>
            {item.legendDetail && (
              <Tooltip
                showDelayMs={150}
                placement="top"
                tooltipContent={item.legendDetail}
                tooltipClassName="max-w-64 border-blue-400 bg-gray-0 text-left text-gray-800 dark:border-blue-400-dark dark:bg-gray-0-dark dark:text-gray-800-dark"
                className="text-[11px] leading-none text-gray-500 dark:text-gray-500-dark"
              >
                <span
                  aria-label={`More information about ${item.label}`}
                  className="inline-flex size-3.5 items-center justify-center rounded-full"
                >
                  <FontAwesomeIcon
                    icon={faCircleQuestion}
                    className="size-3.5"
                  />
                </span>
              </Tooltip>
            )}
          </div>
        );
      })}
    </div>
  );
};

const wrapText = (text: string, maxCharsPerLine: number): string[] => {
  if (text.length <= maxCharsPerLine) return [text];

  const words = text.split(" ");
  const lines: string[] = [];
  let currentLine = "";

  for (const word of words) {
    const testLine = currentLine ? `${currentLine} ${word}` : word;
    if (testLine.length <= maxCharsPerLine) {
      currentLine = testLine;
    } else {
      if (currentLine) lines.push(currentLine);
      currentLine = word;
    }
  }

  if (currentLine) lines.push(currentLine);
  return lines;
};

const CustomYAxisTickLabel: FC<{
  x?: number;
  y?: number;
  text?: string;
  textColor?: string;
  offsetX?: number;
  offsetY?: number;
  maxCharsPerLine?: number;
  lineHeight?: number;
}> = ({
  x,
  y,
  text,
  textColor,
  offsetX = 0,
  offsetY = 0,
  maxCharsPerLine = 12,
  lineHeight = 14,
}) => {
  if (x === undefined || y === undefined || !text) return null;

  const lines = wrapText(text, maxCharsPerLine);
  const totalHeight = (lines.length - 1) * lineHeight;
  const startY = y + offsetY - totalHeight;

  return (
    <text
      x={x + offsetX}
      textAnchor="end"
      fill={textColor}
      fontSize={12}
      fontWeight={400}
      fontFamily="var(--font-inter-variable), var(--font-inter), sans-serif"
    >
      {lines.map((line, index) => (
        <tspan
          key={index}
          x={x + offsetX}
          y={startY + index * lineHeight}
          dominantBaseline="middle"
        >
          {line}
        </tspan>
      ))}
    </text>
  );
};

const DataPointCircle: FC<{
  x?: number;
  y?: number;
  datum?: MultiLineChartPoint;
  strokeColor?: string;
  fillColor?: string;
  isFilled?: boolean;
  bgColor?: string;
  radius?: number;
  opacity?: number;
  highlightedX?: number | null;
  hoverRadiusDelta?: number;
}> = ({
  x,
  y,
  datum,
  strokeColor,
  fillColor,
  isFilled,
  bgColor,
  radius = 6,
  opacity = 1,
  highlightedX,
  hoverRadiusDelta = 0,
}) => {
  if (x === undefined || y === undefined) return null;

  const resolvedBaseRadius = datum?.dotSize ?? radius;
  const resolvedRadius =
    highlightedX != null && datum?.x === highlightedX
      ? resolvedBaseRadius + hoverRadiusDelta
      : resolvedBaseRadius;
  const resolvedIsFilled = datum?.filled ?? isFilled;

  return (
    <circle
      cx={x}
      cy={y}
      r={resolvedRadius}
      fill={resolvedIsFilled ? fillColor : bgColor}
      stroke={strokeColor}
      strokeWidth={2}
      opacity={opacity}
    />
  );
};

const DATA_LABEL_BADGE_HEIGHT = 18;
const DATA_LABEL_FONT_SIZE = 12;
const DATA_LABEL_GAP = 4;
const DATA_LABEL_COLLISION_GAP_PX = 4;

const computeBadgeWidth = (text: string) =>
  estimateNumericLabelWidthPx(text) + 8;

type DataLabelBox = {
  left: number;
  right: number;
  top: number;
  bottom: number;
};

type DataLabelLayoutParams = {
  plotLeft: number;
  plotRight: number;
  plotTop: number;
  plotBottom: number;
  xMin: number;
  xMax: number;
  yMin: number;
  yMax: number;
};

const computeDataLabelBox = (
  point: { x: number; y: number },
  labelText: string,
  placement: DataLabelPlacement,
  pointRadius: number,
  layout: DataLabelLayoutParams
): DataLabelBox | null => {
  const { plotLeft, plotRight, plotTop, plotBottom, xMin, xMax, yMin, yMax } =
    layout;
  const plotWidth = plotRight - plotLeft;
  const plotHeight = plotBottom - plotTop;
  const xSpan = xMax - xMin;
  const ySpan = yMax - yMin;
  if (plotWidth <= 0 || plotHeight <= 0 || xSpan === 0 || ySpan === 0)
    return null;

  const badgeWidth = computeBadgeWidth(labelText);
  const cx = plotLeft + ((point.x - xMin) / xSpan) * plotWidth;
  const cy = plotBottom - ((point.y - yMin) / ySpan) * plotHeight;

  let badgeTop: number;
  switch (placement) {
    case "above":
      badgeTop = cy - pointRadius - DATA_LABEL_GAP - DATA_LABEL_BADGE_HEIGHT;
      break;
    case "inline":
      badgeTop = cy - DATA_LABEL_BADGE_HEIGHT / 2;
      break;
    case "below":
    default:
      badgeTop = cy + pointRadius + DATA_LABEL_GAP;
      break;
  }

  return {
    left: cx - badgeWidth / 2,
    right: cx + badgeWidth / 2,
    top: badgeTop,
    bottom: badgeTop + DATA_LABEL_BADGE_HEIGHT,
  };
};

const dataLabelBoxesCollide = (a: DataLabelBox, b: DataLabelBox): boolean => {
  const horizontalOverlap = !(
    a.right + DATA_LABEL_COLLISION_GAP_PX <= b.left ||
    b.right + DATA_LABEL_COLLISION_GAP_PX <= a.left
  );
  const verticalOverlap = !(
    a.bottom + DATA_LABEL_COLLISION_GAP_PX <= b.top ||
    b.bottom + DATA_LABEL_COLLISION_GAP_PX <= a.top
  );
  return horizontalOverlap && verticalOverlap;
};

const ChangeBadge: FC<{
  x?: number;
  y?: number;
  datum?: MultiLineChartPoint;
  formatValue: (value: number) => string;
  alwaysVisible?: boolean;
  highlightedX?: number | null;
  placement?: DataLabelPlacement;
  pointRadius?: number;
  lineColor: string;
  labelColor?: string;
  transparent?: boolean;
  groupClassName?: string;
  rectClassName?: string;
  textClassName?: string;
  /** Per-x badge top overrides (pixels). When the map contains datum.x, that value replaces the computed badge top. */
  badgeTopsByX?: Map<number, number>;
}> = ({
  x,
  y,
  datum,
  formatValue,
  alwaysVisible = false,
  highlightedX,
  placement = "inline",
  pointRadius = 8,
  lineColor,
  labelColor = METAC_COLORS.gray["0"].DEFAULT,
  transparent = false,
  groupClassName,
  rectClassName,
  textClassName,
  badgeTopsByX,
}) => {
  if (x === undefined || y === undefined || !datum) return null;
  if (!alwaysVisible && (highlightedX == null || datum.x !== highlightedX))
    return null;
  if (datum.y === 0) return null;

  const bgColor = transparent ? "transparent" : lineColor;
  const labelTextColor = transparent ? lineColor : labelColor;
  const text = formatValue(datum.y);
  const badgeWidth = computeBadgeWidth(text);

  const overrideTop = badgeTopsByX?.get(datum.x);

  let badgeTop: number;
  if (overrideTop != null) {
    badgeTop = overrideTop;
  } else {
    switch (placement) {
      case "above":
        badgeTop = y - pointRadius - DATA_LABEL_GAP - DATA_LABEL_BADGE_HEIGHT;
        break;
      case "inline":
        badgeTop = y - DATA_LABEL_BADGE_HEIGHT / 2;
        break;
      case "below":
      default:
        badgeTop = y + pointRadius + DATA_LABEL_GAP;
        break;
    }
  }

  return (
    <g className={cn("pointer-events-none", groupClassName)}>
      <rect
        className={rectClassName}
        x={x - badgeWidth / 2}
        y={badgeTop}
        width={badgeWidth}
        height={DATA_LABEL_BADGE_HEIGHT}
        rx={3}
        ry={3}
        fill={bgColor}
      />
      <text
        className={textClassName}
        x={x}
        y={badgeTop + DATA_LABEL_BADGE_HEIGHT / 2 + 1}
        textAnchor="middle"
        dominantBaseline="middle"
        fill={labelTextColor}
        fontSize={DATA_LABEL_FONT_SIZE}
        fontWeight={450}
        fontFamily="var(--font-inter-variable), var(--font-inter), sans-serif"
      >
        {text}
      </text>
    </g>
  );
};

const getAlwaysVisibleLabelMode = (
  mode: DataLabelMode | undefined,
  isPrintMode: boolean
) => mode === "always" || (isPrintMode && mode !== "never");

const getHoverLabelMode = (mode: DataLabelMode | undefined) =>
  mode !== "always" && mode !== "never";

export const MultiLineChart: FC<Props> = ({
  series,
  height = 250,
  yAxisLabels,
  showTickLabels = false,
  showLegend = true,
  legendOrder,
  yAxisGutter,
  formatYTick,
  formatYValue: formatYValueProp,
  formatXTick,
  highlightedX: highlightedXProp,
  defaultHighlightedX = null,
  onHighlightedXChange,
  clearHighlightOnMouseLeave = true,
  emphasizedSeriesId = null,
  historicalForecastDividerX = null,
  showHistoricalForecastAnnotation = true,
  hideHistoricalLabelsInPrint = false,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const isPrintMode = usePrintOverride();
  const [uncontrolledHighlightedX, setUncontrolledHighlightedX] = useState<
    number | null
  >(defaultHighlightedX);
  const [cursorY, setCursorY] = useState<number | null>(null);

  const highlightedX =
    highlightedXProp === undefined
      ? uncontrolledHighlightedX
      : highlightedXProp;

  const setHighlightedX = useCallback(
    (value: number | null) => {
      if (highlightedXProp === undefined) {
        setUncontrolledHighlightedX(value);
      }
      onHighlightedXChange?.(value);
    },
    [highlightedXProp, onHighlightedXChange]
  );

  const formatResolvedYValue = formatYValueProp ?? defaultFormatYValue;
  const formatResolvedYTick =
    formatYTick ?? formatYValueProp ?? defaultFormatYTick;

  const {
    xDomain,
    yDomain,
    xTickValues: resolvedXTickValues,
    labelTickValues,
    gridYTickValues,
    leftPadding,
    labelTickFormat,
    gridAxisTickFormat,
    customYAxisTickMaxChars,
  } = useMemo(
    () =>
      computeMultiLineChartModel({
        series,
        yAxisLabels,
        showTickLabels,
        formatYTick: formatResolvedYTick,
        yAxisGutter,
      }),
    [series, yAxisLabels, showTickLabels, formatResolvedYTick, yAxisGutter]
  );

  const shouldDisplayChart = !!chartWidth;
  const gridColor = getThemeColor(METAC_COLORS.gray["400"]);
  const activeXTickColor = getThemeColor(METAC_COLORS.gray["700"]);
  const bgColor = getThemeColor(METAC_COLORS.gray["0"]);
  const historicalForecastDividerColor = getThemeColor(
    METAC_COLORS.blue["600"]
  );

  const emphasisActive = emphasizedSeriesId != null;
  const historicalForecastLayout = useMemo(() => {
    if (
      !showHistoricalForecastAnnotation ||
      !chartWidth ||
      historicalForecastDividerX == null
    )
      return null;

    const plotLeft = leftPadding;
    const plotRight = chartWidth - CHART_PADDING.right;
    const plotWidth = plotRight - plotLeft;
    const [xMin, xMax] = xDomain;
    if (plotWidth <= 0 || xMax === xMin) return null;

    const dividerSvgX =
      plotLeft +
      ((historicalForecastDividerX - xMin) / (xMax - xMin)) * plotWidth;

    if (dividerSvgX <= plotLeft || dividerSvgX >= plotRight) return null;

    return {
      dividerSvgX,
      historicalLabelX: (plotLeft + dividerSvgX) / 2,
      forecastLabelX: (dividerSvgX + plotRight) / 2,
    };
  }, [
    showHistoricalForecastAnnotation,
    chartWidth,
    historicalForecastDividerX,
    leftPadding,
    xDomain,
  ]);

  const seriesEntries = useMemo<ResolvedSeriesEntry[]>(
    () =>
      series.map((item) => {
        const opacity = emphasisActive
          ? item.id === emphasizedSeriesId
            ? 1
            : 0.32
          : 1;
        const baseStrokeWidth = item.dashed ? 1.5 : 2;
        const strokeWidth =
          emphasisActive && item.id === emphasizedSeriesId
            ? Math.max(baseStrokeWidth, 5)
            : baseStrokeWidth;
        const basePointRadius = item.dotSize ?? (item.filled ? 6 : 7);
        const pointRadius =
          emphasisActive && item.id === emphasizedSeriesId
            ? basePointRadius + 2
            : basePointRadius;

        return {
          series: item,
          chartData: item.data.map((point) => ({
            ...point,
            x: point.x,
            y: point.y,
          })),
          colors: getSeriesColors(item.color, getThemeColor),
          pointRadius,
          opacity,
          strokeWidth,
        };
      }),
    [series, emphasisActive, emphasizedSeriesId, getThemeColor]
  );

  const handleChartMouseMove = useCallback(
    (event: MouseEvent<HTMLDivElement>) => {
      if (!chartWidth || !resolvedXTickValues.length) return;

      const rect = event.currentTarget.getBoundingClientRect();
      const offsetX = event.clientX - rect.left;
      const offsetY = event.clientY - rect.top;
      const plotLeft = leftPadding;
      const plotWidth = chartWidth - plotLeft - CHART_PADDING.right;
      if (plotWidth <= 0) return;

      if (offsetX < plotLeft || offsetX > chartWidth - CHART_PADDING.right) {
        setHighlightedX(null);
        setCursorY(null);
        return;
      }

      setCursorY(offsetY);

      const progress = (offsetX - plotLeft) / plotWidth;
      const [xMin, xMax] = xDomain;
      const highlightedValue = xMin + progress * (xMax - xMin);
      const closest = closestTickValue(highlightedValue, resolvedXTickValues);
      if (closest != null) {
        setHighlightedX(closest);
      }
    },
    [chartWidth, leftPadding, resolvedXTickValues, setHighlightedX, xDomain]
  );

  const handleChartMouseLeave = useCallback(() => {
    if (clearHighlightOnMouseLeave) {
      setHighlightedX(null);
    }
    setCursorY(null);
  }, [clearHighlightOnMouseLeave, setHighlightedX]);

  const autoVisibleXTickValues = useMemo<number[]>(() => {
    if (!chartWidth || resolvedXTickValues.length <= 1)
      return resolvedXTickValues;

    const layoutParams: XTickLabelLayoutParams = {
      plotLeft: leftPadding,
      plotRight: chartWidth - CHART_PADDING.right,
      xMin: xDomain[0],
      xMax: xDomain[1],
      formatXTick,
    };

    const tickBoxes = resolvedXTickValues.map((xValue) => ({
      xValue,
      box: computeXTickLabelBox(xValue, layoutParams),
    }));
    if (tickBoxes.some((entry) => entry.box === null)) {
      return resolvedXTickValues;
    }

    const firstEntry = tickBoxes[0] as { xValue: number; box: XTickLabelBox };
    const lastEntry = tickBoxes[tickBoxes.length - 1] as {
      xValue: number;
      box: XTickLabelBox;
    };

    if (xTickLabelsCollide(firstEntry.box, lastEntry.box)) {
      return [lastEntry.xValue];
    }

    const isForecast = (xValue: number) =>
      historicalForecastDividerX != null && xValue > historicalForecastDividerX;

    const kept: { xValue: number; box: XTickLabelBox }[] = [firstEntry];

    for (let i = 1; i < tickBoxes.length - 1; i++) {
      const current = tickBoxes[i] as { xValue: number; box: XTickLabelBox };
      const lastKept = kept[kept.length - 1];
      if (!lastKept) break;
      if (!xTickLabelsCollide(lastKept.box, current.box)) {
        kept.push(current);
        continue;
      }
      const boundaryHandoff =
        isForecast(current.xValue) &&
        !isForecast(lastKept.xValue) &&
        kept.length > 1;
      if (boundaryHandoff) {
        kept.pop();
        kept.push(current);
      }
    }

    while (kept.length > 1) {
      const tail = kept[kept.length - 1];
      if (!tail || !xTickLabelsCollide(tail.box, lastEntry.box)) break;
      kept.pop();
    }
    kept.push(lastEntry);

    return kept.map((entry) => entry.xValue);
  }, [
    resolvedXTickValues,
    chartWidth,
    leftPadding,
    xDomain,
    formatXTick,
    historicalForecastDividerX,
  ]);

  const renderedXTickSet = useMemo<Set<number>>(() => {
    const baseSet = new Set(autoVisibleXTickValues);
    if (highlightedX == null || !chartWidth) return baseSet;

    const layoutParams: XTickLabelLayoutParams = {
      plotLeft: leftPadding,
      plotRight: chartWidth - CHART_PADDING.right,
      xMin: xDomain[0],
      xMax: xDomain[1],
      formatXTick,
    };

    const hoverBox = computeXTickLabelBox(highlightedX, layoutParams);
    if (!hoverBox) return baseSet;

    const result = new Set<number>([highlightedX]);
    for (const xValue of autoVisibleXTickValues) {
      if (xValue === highlightedX) continue;
      const box = computeXTickLabelBox(xValue, layoutParams);
      if (!box || !xTickLabelsCollide(hoverBox, box)) {
        result.add(xValue);
      }
    }
    return result;
  }, [
    autoVisibleXTickValues,
    highlightedX,
    chartWidth,
    leftPadding,
    xDomain,
    formatXTick,
  ]);

  const formatResolvedXTick = useCallback(
    (tick: string | number) => {
      const numericTick = typeof tick === "number" ? tick : Number(tick);
      if (!renderedXTickSet.has(numericTick)) return "";
      return formatXTick ? formatXTick(numericTick) : String(tick);
    },
    [formatXTick, renderedXTickSet]
  );

  const inlineHoverSeriesOrdered = useMemo<ResolvedSeriesEntry[]>(() => {
    const filtered = seriesEntries.filter(
      ({ series: item }) =>
        getHoverLabelMode(item.dataLabels) &&
        (item.dataLabelPlacement ?? "inline") === "inline"
    );

    if (
      highlightedX == null ||
      cursorY == null ||
      !chartWidth ||
      filtered.length <= 1
    ) {
      return filtered;
    }

    const plotTop = CHART_PADDING.top;
    const plotBottom = height - CHART_PADDING.bottom;
    const plotHeight = plotBottom - plotTop;
    const [yMin, yMax] = yDomain;
    const ySpan = yMax - yMin;
    if (plotHeight <= 0 || ySpan === 0) return filtered;

    const distanceFor = (entry: ResolvedSeriesEntry): number => {
      const point = entry.chartData.find((p) => p.x === highlightedX);
      if (!point || point.y === 0) return Infinity;
      const pixelY = plotBottom - ((point.y - yMin) / ySpan) * plotHeight;
      return Math.abs(pixelY - cursorY);
    };

    return [...filtered].sort((a, b) => distanceFor(b) - distanceFor(a));
  }, [seriesEntries, highlightedX, cursorY, chartWidth, height, yDomain]);

  const visibleDataLabelXsBySeries = useMemo<Map<string, Set<number>>>(() => {
    const result = new Map<string, Set<number>>();
    if (!chartWidth) return result;

    const layout: DataLabelLayoutParams = {
      plotLeft: leftPadding,
      plotRight: chartWidth - CHART_PADDING.right,
      plotTop: CHART_PADDING.top,
      plotBottom: height - CHART_PADDING.bottom,
      xMin: xDomain[0],
      xMax: xDomain[1],
      yMin: yDomain[0],
      yMax: yDomain[1],
    };

    for (const entry of seriesEntries) {
      const placement = entry.series.dataLabelPlacement ?? "inline";
      const sortedPoints = [...entry.chartData].sort((a, b) => a.x - b.x);
      const keptBoxes: DataLabelBox[] = [];
      const keptXs = new Set<number>();

      for (const point of sortedPoints) {
        if (point.y === 0) continue;
        const box = computeDataLabelBox(
          point,
          formatResolvedYValue(point.y),
          placement,
          entry.pointRadius,
          layout
        );
        if (!box) continue;
        const collides = keptBoxes.some((existing) =>
          dataLabelBoxesCollide(existing, box)
        );
        if (!collides) {
          keptBoxes.push(box);
          keptXs.add(point.x);
        }
      }
      result.set(entry.series.id, keptXs);
    }

    return result;
  }, [
    seriesEntries,
    chartWidth,
    leftPadding,
    height,
    xDomain,
    yDomain,
    formatResolvedYValue,
  ]);

  const badgeTopOverridesBySeries = useMemo<
    Map<string, Map<number, number>>
  >(() => {
    const result = new Map<string, Map<number, number>>();
    if (!chartWidth) return result;

    const plotTop = CHART_PADDING.top;
    const plotBottom = height - CHART_PADDING.bottom;
    const plotHeight = plotBottom - plotTop;
    const [yMin, yMax] = yDomain;
    const ySpan = yMax - yMin;
    if (plotHeight <= 0 || ySpan === 0) return result;

    type Candidate = { seriesId: string; naturalTop: number };
    const byX = new Map<number, Candidate[]>();

    for (const entry of seriesEntries) {
      const item = entry.series;
      if ((item.dataLabelPlacement ?? "inline") !== "inline") continue;

      const alwaysMode = getAlwaysVisibleLabelMode(
        item.dataLabels,
        isPrintMode
      );
      const hoverMode = !isPrintMode && getHoverLabelMode(item.dataLabels);
      if (!alwaysMode && !hoverMode) continue;

      const perSeriesVisible = visibleDataLabelXsBySeries.get(item.id);

      for (const point of entry.chartData) {
        if (point.y === 0) continue;
        if (isPrintMode && hideHistoricalLabelsInPrint && point.filled === true)
          continue;

        let shows = false;
        if (alwaysMode) {
          shows = !perSeriesVisible || perSeriesVisible.has(point.x);
        } else if (
          hoverMode &&
          highlightedX != null &&
          point.x === highlightedX
        ) {
          shows = true;
        }
        if (!shows) continue;

        const pixelY = plotBottom - ((point.y - yMin) / ySpan) * plotHeight;
        const naturalTop = pixelY - DATA_LABEL_BADGE_HEIGHT / 2;

        let list = byX.get(point.x);
        if (!list) {
          list = [];
          byX.set(point.x, list);
        }
        list.push({ seriesId: item.id, naturalTop });
      }
    }

    const minTop = plotTop + 2;
    const maxTop = plotBottom - DATA_LABEL_BADGE_HEIGHT - 2;
    const stride = DATA_LABEL_BADGE_HEIGHT;

    for (const [xValue, candidates] of byX) {
      if (candidates.length < 2) continue;

      const sorted = [...candidates].sort(
        (a, b) => a.naturalTop - b.naturalTop
      );
      const placed = sorted.map((c) => c.naturalTop);

      for (let iter = 0; iter < 12; iter += 1) {
        let maxShift = 0;
        for (let i = 1; i < sorted.length; i += 1) {
          const overlap = (placed[i - 1] ?? 0) + stride - (placed[i] ?? 0);
          if (overlap > 0) {
            const half = overlap / 2;
            placed[i - 1] = (placed[i - 1] ?? 0) - half;
            placed[i] = (placed[i] ?? 0) + half;
            if (half > maxShift) maxShift = half;
          }
        }
        if (maxShift < 0.5) break;
      }

      for (let i = 0; i < placed.length; i += 1) {
        const value = placed[i] ?? 0;
        if (value < minTop) placed[i] = minTop;
        else if (value > maxTop) placed[i] = maxTop;
      }

      for (let i = 0; i < sorted.length; i += 1) {
        const candidate = sorted[i];
        const resolvedTop = placed[i];
        if (!candidate || resolvedTop == null) continue;
        if (Math.abs(resolvedTop - candidate.naturalTop) < 0.5) continue;

        let seriesMap = result.get(candidate.seriesId);
        if (!seriesMap) {
          seriesMap = new Map<number, number>();
          result.set(candidate.seriesId, seriesMap);
        }
        seriesMap.set(xValue, resolvedTop);
      }
    }

    return result;
  }, [
    seriesEntries,
    highlightedX,
    chartWidth,
    height,
    yDomain,
    visibleDataLabelXsBySeries,
    isPrintMode,
    hideHistoricalLabelsInPrint,
  ]);

  return (
    <div className="w-full">
      {showLegend && (
        <Legend
          series={series}
          order={legendOrder}
          getThemeColor={getThemeColor}
        />
      )}

      <div
        ref={chartContainerRef}
        className="relative w-full cursor-crosshair"
        style={{ height }}
        onMouseMove={handleChartMouseMove}
        onMouseLeave={handleChartMouseLeave}
      >
        {shouldDisplayChart && (
          <VictoryChart
            width={chartWidth}
            height={height}
            theme={chartTheme}
            domain={{ x: xDomain, y: yDomain }}
            padding={{
              top: CHART_PADDING.top,
              bottom: CHART_PADDING.bottom,
              left: leftPadding,
              right: CHART_PADDING.right,
            }}
            containerComponent={
              <VictoryContainer
                style={{
                  pointerEvents: "auto",
                  userSelect: "auto",
                  touchAction: "auto",
                }}
              />
            }
          >
            <VictoryAxis
              tickValues={resolvedXTickValues}
              tickFormat={formatResolvedXTick}
              offsetY={35}
              style={{
                axis: { stroke: "transparent" },
                ticks: { stroke: "transparent" },
                tickLabels: {
                  fill: ({ tick }: { tick?: string | number }) =>
                    highlightedX != null && Number(tick) === highlightedX
                      ? activeXTickColor
                      : gridColor,
                  fontSize: 12,
                  fontWeight: ({ tick }: { tick?: string | number }) =>
                    highlightedX != null && Number(tick) === highlightedX
                      ? 600
                      : 400,
                  fontFamily:
                    "var(--font-inter-variable), var(--font-inter), sans-serif",
                },
              }}
            />

            <VictoryAxis
              dependentAxis
              tickValues={gridYTickValues}
              tickFormat={gridAxisTickFormat}
              style={{
                axis: { stroke: "transparent" },
                ticks: { stroke: "transparent", size: 0 },
                tickLabels: showTickLabels
                  ? {
                      fill: gridColor,
                      fontSize: 12,
                      fontWeight: 400,
                      fontFamily:
                        "var(--font-inter-variable), var(--font-inter), sans-serif",
                      padding: 4,
                    }
                  : { fill: "transparent" },
                grid: {
                  stroke: gridColor,
                  strokeDasharray: "1, 5",
                  strokeLinecap: "round",
                },
              }}
              gridComponent={<LineSegment />}
            />

            {!!yAxisLabels?.length && (
              <VictoryAxis
                dependentAxis
                tickValues={labelTickValues}
                tickFormat={labelTickFormat}
                tickLabelComponent={
                  <CustomYAxisTickLabel
                    textColor={gridColor}
                    offsetX={14}
                    offsetY={-8}
                    maxCharsPerLine={customYAxisTickMaxChars}
                    lineHeight={14}
                  />
                }
                style={{
                  axis: {
                    stroke: gridColor,
                    strokeDasharray: "1, 5",
                    strokeLinecap: "round",
                  },
                  ticks: { stroke: gridColor, size: 18 },
                  tickLabels: {},
                  grid: { stroke: "transparent" },
                }}
              />
            )}

            {highlightedX != null && (
              <VictoryLine
                data={[
                  { x: highlightedX, y: yDomain[0] },
                  { x: highlightedX, y: yDomain[1] },
                ]}
                style={{
                  data: {
                    stroke: gridColor,
                    strokeWidth: 1,
                    strokeDasharray: "4 3",
                    opacity: emphasisActive ? 0.45 : 0.75,
                  },
                }}
              />
            )}

            {historicalForecastLayout && (
              <VictoryLabel
                text="HISTORICAL"
                x={historicalForecastLayout.historicalLabelX}
                y={AREA_SECTION_LABEL_Y}
                textAnchor="middle"
                style={{
                  fill: historicalForecastDividerColor,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  fontFamily:
                    "var(--font-inter-variable), var(--font-inter), sans-serif",
                }}
              />
            )}

            {historicalForecastLayout && (
              <VictoryLabel
                text="FORECAST"
                x={historicalForecastLayout.forecastLabelX}
                y={AREA_SECTION_LABEL_Y}
                textAnchor="middle"
                style={{
                  fill: historicalForecastDividerColor,
                  fontSize: 10,
                  fontWeight: 600,
                  letterSpacing: "0.08em",
                  fontFamily:
                    "var(--font-inter-variable), var(--font-inter), sans-serif",
                }}
              />
            )}

            {showHistoricalForecastAnnotation &&
              historicalForecastDividerX != null && (
                <VictoryLine
                  data={[
                    { x: historicalForecastDividerX, y: yDomain[0] },
                    { x: historicalForecastDividerX, y: yDomain[1] },
                  ]}
                  style={{
                    data: {
                      stroke: historicalForecastDividerColor,
                      strokeWidth: 1.5,
                      strokeDasharray: "6 4",
                      opacity: emphasisActive ? 0.6 : 0.8,
                    },
                  }}
                />
              )}

            {seriesEntries.map(
              ({ series: item, chartData, colors, opacity, strokeWidth }) => (
                <VictoryLine
                  key={item.id}
                  data={chartData}
                  style={{
                    data: {
                      stroke: colors.stroke,
                      strokeWidth,
                      opacity,
                      ...(item.dashed && { strokeDasharray: "6, 4" }),
                    },
                  }}
                />
              )
            )}

            {seriesEntries.map(
              ({ series: item, chartData, colors, opacity, pointRadius }) => {
                const showsInlineHoverBadge =
                  !isPrintMode &&
                  getHoverLabelMode(item.dataLabels) &&
                  (item.dataLabelPlacement ?? "inline") === "inline";

                return (
                  <VictoryScatter
                    key={`scatter-${item.id}`}
                    data={chartData}
                    dataComponent={
                      <DataPointCircle
                        strokeColor={colors.stroke}
                        fillColor={colors.fill}
                        isFilled={item.filled}
                        bgColor={bgColor}
                        radius={pointRadius}
                        opacity={opacity}
                        highlightedX={highlightedX}
                        hoverRadiusDelta={showsInlineHoverBadge ? 0 : 2}
                      />
                    }
                  />
                );
              }
            )}

            {seriesEntries
              .filter(({ series: item }) =>
                getAlwaysVisibleLabelMode(item.dataLabels, isPrintMode)
              )
              .map(({ series: item, chartData, colors, pointRadius }) => {
                const visibleXs = visibleDataLabelXsBySeries.get(item.id);
                const baseData = visibleXs
                  ? chartData.filter((p) => visibleXs.has(p.x))
                  : chartData;
                const data =
                  isPrintMode && hideHistoricalLabelsInPrint
                    ? baseData.filter((p) => p.filled !== true)
                    : baseData;
                return (
                  <VictoryScatter
                    key={`labels-always-${item.id}`}
                    data={data}
                    dataComponent={
                      <ChangeBadge
                        formatValue={formatResolvedYValue}
                        alwaysVisible
                        placement={item.dataLabelPlacement}
                        pointRadius={pointRadius}
                        lineColor={colors.stroke}
                        labelColor={pickHighestContrastTextColor(colors.stroke)}
                        transparent={item.dataLabelTransparent}
                        groupClassName={cn(
                          item.dataLabelClassName,
                          emphasisActive &&
                            item.id !== emphasizedSeriesId &&
                            "opacity-[0.32]"
                        )}
                        rectClassName={item.dataLabelRectClassName}
                        textClassName={item.dataLabelTextClassName}
                        badgeTopsByX={badgeTopOverridesBySeries.get(item.id)}
                      />
                    }
                  />
                );
              })}

            {!isPrintMode &&
              (highlightedX != null || emphasisActive) &&
              inlineHoverSeriesOrdered.map(
                ({ series: item, chartData, colors, pointRadius }) => {
                  const isEmphasized =
                    emphasisActive && item.id === emphasizedSeriesId;
                  const showAllBadges = isEmphasized;
                  const showHighlightedBadge =
                    highlightedX != null && (!emphasisActive || !isEmphasized);

                  if (!showAllBadges && !showHighlightedBadge) return null;

                  const visibleXs = showAllBadges
                    ? visibleDataLabelXsBySeries.get(item.id)
                    : undefined;
                  const data = visibleXs
                    ? chartData.filter((p) => visibleXs.has(p.x))
                    : chartData;

                  return (
                    <VictoryScatter
                      key={`labels-hover-${item.id}`}
                      data={data}
                      dataComponent={
                        <ChangeBadge
                          formatValue={formatResolvedYValue}
                          alwaysVisible={showAllBadges}
                          highlightedX={showAllBadges ? null : highlightedX}
                          placement={item.dataLabelPlacement}
                          pointRadius={pointRadius}
                          lineColor={colors.stroke}
                          labelColor={pickHighestContrastTextColor(
                            colors.stroke
                          )}
                          transparent={item.dataLabelTransparent}
                          groupClassName={cn(
                            item.dataLabelClassName,
                            emphasisActive &&
                              item.id !== emphasizedSeriesId &&
                              "opacity-[0.32]"
                          )}
                          rectClassName={item.dataLabelRectClassName}
                          textClassName={item.dataLabelTextClassName}
                          badgeTopsByX={badgeTopOverridesBySeries.get(item.id)}
                        />
                      }
                    />
                  );
                }
              )}
          </VictoryChart>
        )}
      </div>
    </div>
  );
};

export type {
  DataLabelMode,
  DataLabelPlacement,
  LineSeries,
  MultiLineChartColor,
  MultiLineChartPoint,
  MultiLineChartSeries,
  MultiLineChartYAxisLabel,
};
export type MultiLineChartProps = Props;
export default MultiLineChart;
