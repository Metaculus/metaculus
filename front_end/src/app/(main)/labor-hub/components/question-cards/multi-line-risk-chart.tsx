"use client";

import { FC, useCallback, useMemo, useState, type MouseEvent } from "react";
import {
  LineSegment,
  VictoryAxis,
  VictoryChart,
  VictoryContainer,
  VictoryLine,
  VictoryScatter,
} from "victory";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import cn from "@/utils/core/cn";

import { useLaborHubChartHover } from "../labor-hub-chart-hover-context";

type DataPoint = {
  year: number;
  value: number;
};

/** Where the value badge sits relative to each point. */
export type DataLabelPlacement = "above" | "below" | "inline";

export type LineSeries = {
  id: string;
  data: DataPoint[];
  color: "green" | "gray" | "red" | "blue";
  filled?: boolean; // Whether points should be filled or hollow
  label?: string; // Legend label for this series
  dashed?: boolean; // Render as a dashed line
  /**
   * Value badges: `true` = always; `false` = never (including hover); omitted / `undefined` = on hover only (when chart supports sync hover).
   */
  showDataLabels?: boolean;
  dotSize?: number; // Point radius (default: 6 filled, 8 hollow)
  legendStyle?: "dot" | "line"; // Legend icon style (default: "dot")

  /** Badge position relative to the point (default: `inline`). */
  dataLabelPlacement?: DataLabelPlacement;
  /**
   * Default badge: background matches series line color, text white.
   * When `true`: no fill on the badge rect (transparent), text uses the series line color.
   */
  dataLabelTransparent?: boolean;
  /**
   * Optional Tailwind/classes for extra styling (shadows, borders, `fill-*` / `text-*` overrides).
   */
  dataLabelClassName?: string;
  dataLabelRectClassName?: string;
  dataLabelTextClassName?: string;
};

type YAxisLabel = {
  text: string;
  value: number; // The Y-axis value this label should align with
};

type Props = {
  series: LineSeries[];
  height?: number;
  yAxisLabels?: YAxisLabel[];
  showTickLabels?: boolean; // Show value labels on grid tick lines
  showLegend?: boolean;
  legendOrder?: string[]; // Optional: order series by id for legend display
  /** Left padding (px) for Y-axis labels. When omitted, width is derived from label type (narrow for numeric ticks, wider for custom yAxisLabels). */
  yAxisGutter?: number;
  /** Formats numeric Y values for grid tick labels and `showDataLabels` badges. If omitted, ticks use whole-number % (`defaultFormatYTick`); badges use one decimal (`defaultFormatYValue`). */
  formatYValue?: (value: number) => string;
  /**
   * When true (and wrapped in `LaborHubChartHoverProvider`), highlighted year
   * is shared with other labor-hub charts on the page.
   */
  syncHover?: boolean;
};

/** Default Y-axis tick labels: whole-number %, explicit + for positives. */
export const defaultFormatYTick = (value: number): string => {
  if (value === 0) return "0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(0)}%`;
};

/** Text on series-colored data label pills (readable on green/red/gray strokes in both themes). */
const DATA_LABEL_ON_SERIES_FILL = "#ffffff";

/** Default for `showDataLabels` badges: one decimal and %. */
export const defaultFormatYValue = (value: number): string => {
  if (value === 0) return "0.0%";
  const sign = value > 0 ? "+" : "";
  return `${sign}${value.toFixed(1)}%`;
};

// Get color based on series color type
const getSeriesColors = (
  colorType: "green" | "gray" | "red" | "blue",
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string
) => {
  switch (colorType) {
    case "green":
      return {
        stroke: getThemeColor(METAC_COLORS["mc-option"]["3"]),
        fill: getThemeColor(METAC_COLORS["mc-option"]["3"]),
      };
    case "red":
      return {
        stroke: getThemeColor(METAC_COLORS["mc-option"]["2"]),
        fill: getThemeColor(METAC_COLORS["mc-option"]["2"]),
      };
    case "blue":
      return {
        stroke: getThemeColor(METAC_COLORS.blue["800"]),
        fill: getThemeColor(METAC_COLORS.blue["800"]),
      };
    case "gray":
    default:
      return {
        stroke: getThemeColor(METAC_COLORS.gray["500"]),
        fill: getThemeColor(METAC_COLORS.gray["500"]),
      };
  }
};

// Legend component - derives legend from series data
const Legend: FC<{
  series: LineSeries[];
  order?: string[];
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string;
}> = ({ series, order, getThemeColor }) => {
  // Filter to only series with labels, then order if specified
  const legendItems = useMemo(() => {
    const withLabels = series.filter((s) => s.label);
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
    <div className="mb-3 flex flex-wrap items-center gap-x-4 gap-y-2">
      {legendItems.map((item) => {
        const colors = getSeriesColors(item.color, getThemeColor);
        return (
          <div key={item.id} className="flex items-center gap-1.5">
            {/* Legend icon - using SVG to match chart color space in Safari */}
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
            {/* Legend label */}
            <span className="text-xs font-medium text-gray-700 dark:text-gray-700-dark">
              {item.label}
            </span>
          </div>
        );
      })}
    </div>
  );
};

// Utility to split text into lines based on max character width
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

const CUSTOM_Y_TICK_MAX_CHARS = 10;

/** When Y is driven by `yAxisLabels`, extend domain slightly above the top label so it isn’t flush with the plot edge. */
const LABEL_BOUND_TOP_INSET_RATIO = 0.06;

/** Auto-generated Y tick this close to a custom label anchor is skipped so only one horizontal grid line shows (the label row keeps its line; nearby auto ticks do not). */
const GRID_TICK_NEAR_LABEL_RATIO = 0.05;

/** Float tolerance when matching a grid tick Y to a custom label anchor (suppress duplicate numeric tick label). */
const LABEL_Y_VALUE_EPS = 1e-6;

/** Left gutter for `yAxisLabels`: estimated text width + space for axis tick / label offset (see `CustomYAxisTickLabel`). */
const TEXT_LABEL_GUTTER_AVG_CHAR_PX = 6.5;
const TEXT_LABEL_GUTTER_LEADING_PX = 12;
const TEXT_LABEL_GUTTER_MIN_PX = 60;
const TEXT_LABEL_GUTTER_MAX_PX = 118;

/** Approximate left gutter (px) for wrapped custom Y labels; uses same wrap width as CustomYAxisTickLabel. */
function estimateTextLabelYAxisGutter(labels: YAxisLabel[]): number {
  const maxLineChars = Math.max(
    1,
    ...labels.flatMap((l) =>
      wrapText(l.text, CUSTOM_Y_TICK_MAX_CHARS).map((line) => line.length)
    )
  );
  const labelBlockWidth =
    Math.ceil(maxLineChars * TEXT_LABEL_GUTTER_AVG_CHAR_PX) +
    TEXT_LABEL_GUTTER_LEADING_PX;
  return Math.min(
    TEXT_LABEL_GUTTER_MAX_PX,
    Math.max(TEXT_LABEL_GUTTER_MIN_PX, labelBlockWidth)
  );
}

/** Approximate left gutter (px) for numeric tick labels using the same formatter as the axis. */
function estimateNumericYAxisGutter(
  tickValues: number[],
  formatYValue: (value: number) => string
): number {
  if (!tickValues.length) return 44;
  const maxLen = Math.max(...tickValues.map((t) => formatYValue(t).length));
  return Math.min(76, Math.max(36, 12 + maxLen * 8));
}

// Custom Y-axis tick label component for precise positioning control
const CHART_PADDING = { top: 20, bottom: 40, right: 0 } as const;

function closestTickYear(yearFloat: number, ticks: number[]): number | null {
  if (!ticks.length) return null;
  return ticks.reduce((best, y) =>
    Math.abs(y - yearFloat) < Math.abs(best - yearFloat) ? y : best
  );
}

const CustomYAxisTickLabel: FC<{
  x?: number;
  y?: number;
  text?: string;
  textColor?: string;
  // Positioning offsets
  offsetX?: number;
  offsetY?: number;
  // Text wrapping
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

// Custom point component that can be filled or hollow
const DataPointCircle: FC<{
  x?: number;
  y?: number;
  datum?: DataPoint & {
    filled?: boolean;
    colorType?: "green" | "gray" | "red";
  };
  strokeColor?: string;
  fillColor?: string;
  isFilled?: boolean;
  bgColor?: string;
  radius?: number;
}> = ({ x, y, strokeColor, fillColor, isFilled, bgColor, radius = 6 }) => {
  if (x === undefined || y === undefined) return null;

  return (
    <circle
      cx={x}
      cy={y}
      r={radius}
      fill={isFilled ? fillColor : bgColor}
      stroke={strokeColor}
      strokeWidth={2}
    />
  );
};

const DATA_LABEL_BADGE_HEIGHT = 18;
const DATA_LABEL_FONT_SIZE = 12;
/** Gap between point edge and badge for `above` / `below` placement (px). */
const DATA_LABEL_GAP = 4;

// Badge label showing the change value near a data point
const ChangeBadge: FC<{
  x?: number;
  y?: number;
  datum?: DataPoint;
  formatValue: (value: number) => string;
  /**
   * When true (series has `showDataLabels`), badges behave as before: all non-zero points.
   * When false, only the point matching `highlightYear` is shown (hover-only labels).
   */
  alwaysVisible?: boolean;
  highlightYear?: number | null;
  placement?: DataLabelPlacement;
  pointRadius?: number;
  /** Series line / stroke color (resolved theme color). */
  lineColor: string;
  /** When true: transparent rect, text matches `lineColor`. */
  transparent?: boolean;
  groupClassName?: string;
  rectClassName?: string;
  textClassName?: string;
}> = ({
  x,
  y,
  datum,
  formatValue,
  alwaysVisible = false,
  highlightYear,
  placement = "inline",
  pointRadius = 8,
  lineColor,
  transparent = false,
  groupClassName,
  rectClassName,
  textClassName,
}) => {
  if (x === undefined || y === undefined || !datum) return null;
  if (!alwaysVisible) {
    if (highlightYear == null || datum.year !== highlightYear) return null;
  }
  if (datum.value === 0) return null;

  const bgColor = transparent ? "transparent" : lineColor;
  const labelTextColor = transparent ? lineColor : DATA_LABEL_ON_SERIES_FILL;

  const text = formatValue(datum.value);
  const badgeWidth = text.length * 7 + 6;
  const badgeHeight = DATA_LABEL_BADGE_HEIGHT;

  let badgeTop: number;
  switch (placement) {
    case "above":
      badgeTop = y - pointRadius - DATA_LABEL_GAP - badgeHeight;
      break;
    case "inline":
      badgeTop = y - badgeHeight / 2;
      break;
    case "below":
    default:
      badgeTop = y + pointRadius + DATA_LABEL_GAP;
      break;
  }

  return (
    <g className={cn("pointer-events-none", groupClassName)}>
      <rect
        className={rectClassName}
        x={x - badgeWidth / 2}
        y={badgeTop}
        width={badgeWidth}
        height={badgeHeight}
        rx={3}
        ry={3}
        fill={bgColor}
      />
      <text
        className={textClassName}
        x={x}
        y={badgeTop + badgeHeight / 2 + 1}
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

export const MultiLineRiskChart: FC<Props> = ({
  series,
  height = 350,
  yAxisLabels,
  showTickLabels = false,
  showLegend = true,
  legendOrder,
  yAxisGutter: yAxisGutterProp,
  formatYValue: formatYValueProp,
  syncHover = false,
}) => {
  const { ref: chartContainerRef, width: chartWidth } =
    useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;

  const hoverCtx = useLaborHubChartHover();
  const [localHoverYear, setLocalHoverYear] = useState<number | null>(null);
  const useSharedHover = syncHover && hoverCtx != null;
  const highlightYear = useSharedHover ? hoverCtx.hoverYear : localHoverYear;
  const setHoverYear = useCallback(
    (year: number | null) => {
      if (syncHover && hoverCtx) {
        hoverCtx.setHoverYear(year);
      } else {
        setLocalHoverYear(year);
      }
    },
    [syncHover, hoverCtx]
  );

  // Calculate domains from all series data (and y-axis label values when present)
  const { xDomain, yDomain } = useMemo(() => {
    const allYears = series.flatMap((s) => s.data.map((d) => d.year));
    const dataValues = series.flatMap((s) => s.data.map((d) => d.value));

    const minYear = Math.min(...allYears);
    const maxYear = Math.max(...allYears);
    const xPadding = (maxYear - minYear) * 0.1;

    const hasDataLabels = series.some((s) => s.showDataLabels !== false);

    let yMin: number;
    let yMax: number;

    if (yAxisLabels?.length) {
      const labelMin = Math.min(...yAxisLabels.map((l) => l.value));
      const labelMax = Math.max(...yAxisLabels.map((l) => l.value));
      const labelSpan = labelMax - labelMin || 1;
      const topLabelInset = Math.max(
        1,
        labelSpan * LABEL_BOUND_TOP_INSET_RATIO
      );

      if (!dataValues.length) {
        const span = labelSpan;
        yMin = labelMin;
        yMax =
          (labelMax === labelMin ? labelMin + span : labelMax) + topLabelInset;
      } else {
        const dataMin = Math.min(...dataValues);
        const dataMax = Math.max(...dataValues);
        const dataInsideLabels = dataMin >= labelMin && dataMax <= labelMax;

        if (dataInsideLabels) {
          yMin = labelMin;
          yMax = labelMax + topLabelInset;
        } else {
          const minValue = Math.min(dataMin, labelMin);
          const maxValue = Math.max(dataMax, labelMax);
          const range = maxValue - minValue || 1;
          const bottomPadding = range * (hasDataLabels ? 0.3 : 0.15);
          const topPadding = range * 0.15;
          yMin = minValue - bottomPadding;
          yMax = maxValue + topPadding;
        }
      }
    } else {
      if (!dataValues.length) {
        yMin = 0;
        yMax = 1;
      } else {
        const minValue = Math.min(...dataValues);
        const maxValue = Math.max(...dataValues);
        const range = maxValue - minValue || 1;
        const bottomPadding = range * (hasDataLabels ? 0.3 : 0.15);
        const topPadding = range * 0.15;
        yMin = minValue - bottomPadding;
        yMax = maxValue + topPadding;
      }
    }

    return {
      xDomain: [minYear - xPadding, maxYear + xPadding] as [number, number],
      yDomain: [yMin, yMax] as [number, number],
    };
  }, [series, yAxisLabels]);

  // Get unique years for x-axis ticks
  const xTickValues = useMemo(() => {
    const years = new Set(series.flatMap((s) => s.data.map((d) => d.year)));
    return Array.from(years).sort((a, b) => a - b);
  }, [series]);

  // Generate y-axis tick values at a reasonable interval
  const yTickValues = useMemo(() => {
    const [min, max] = yDomain;
    const range = max - min;
    // Pick an interval that gives roughly 4-6 ticks
    const rawStep = range / 5;
    const magnitude = Math.pow(10, Math.floor(Math.log10(rawStep)));
    const candidates = [1, 2, 5, 10, 25, 50].map((m) => m * magnitude);
    const step =
      candidates.find((c) => range / c <= 8 && range / c >= 3) ??
      candidates[candidates.length - 1] ??
      1;

    const ticks: number[] = [];
    const startTick = Math.floor(min / step) * step;
    const endTick = Math.ceil(max / step) * step;
    for (let i = startTick; i <= endTick; i += step) {
      ticks.push(Math.round(i * 1000) / 1000);
    }
    return ticks;
  }, [yDomain]);

  const labelTickValues = useMemo(() => {
    if (!yAxisLabels?.length) return [];
    return [...new Set(yAxisLabels.map((l) => l.value))].sort((a, b) => a - b);
  }, [yAxisLabels]);

  /**
   * Horizontal grid lines: always include each custom label Y; add auto ticks only when
   * they are not near a label anchor (avoids an extra “tick” line next to a label row).
   */
  const gridYTickValues = useMemo(() => {
    if (!yAxisLabels?.length || !labelTickValues.length) return yTickValues;
    const [y0, y1] = yDomain;
    const range = Math.abs(y1 - y0) || 1;
    const minSep = Math.max(range * GRID_TICK_NEAR_LABEL_RATIO, 1e-6);
    const autoTicksNotNearLabels = yTickValues.filter(
      (t) => !labelTickValues.some((lv) => Math.abs(t - lv) <= minSep)
    );
    return [...new Set([...labelTickValues, ...autoTicksNotNearLabels])].sort(
      (a, b) => a - b
    );
  }, [yAxisLabels, yTickValues, labelTickValues, yDomain]);

  const shouldDisplayChart = !!chartWidth;

  const gridColor = getThemeColor(METAC_COLORS.gray["400"]);
  const bgColor = getThemeColor(METAC_COLORS.gray["0"]);

  const autoYAxisGutter = useMemo(() => {
    if (yAxisLabels?.length) return estimateTextLabelYAxisGutter(yAxisLabels);
    if (showTickLabels) {
      const fmt = formatYValueProp ?? defaultFormatYTick;
      return estimateNumericYAxisGutter(gridYTickValues, fmt);
    }
    return 0;
  }, [yAxisLabels, showTickLabels, gridYTickValues, formatYValueProp]);

  const formatYValue = formatYValueProp ?? defaultFormatYValue;
  const formatYTick = formatYValueProp ?? defaultFormatYTick;

  /**
   * Grid-axis numeric tick labels: omit at custom label Y (that row uses `yAxisLabels` text). Auto Ys dropped
   * from the grid as “too close” to a label never appear as ticks, so they need no label suppression here.
   */
  const gridAxisTickFormat = useMemo(() => {
    if (!showTickLabels) return () => "";

    const isCustomLabelAnchor = (n: number) =>
      labelTickValues.some((lv) => Math.abs(n - lv) <= LABEL_Y_VALUE_EPS);

    return (t: string | number) => {
      const n = typeof t === "number" ? t : Number(t);
      if (labelTickValues.length && isCustomLabelAnchor(n)) return "";
      return formatYTick(n);
    };
  }, [showTickLabels, labelTickValues, formatYTick]);

  const leftPadding = yAxisGutterProp ?? autoYAxisGutter;

  const handleChartMouseMove = useCallback(
    (e: MouseEvent<HTMLDivElement>) => {
      if (!chartWidth || !xTickValues.length) return;
      const rect = e.currentTarget.getBoundingClientRect();
      const offsetX = e.clientX - rect.left;
      const plotLeft = leftPadding;
      const plotRightPad = CHART_PADDING.right;
      const plotW = chartWidth - plotLeft - plotRightPad;
      if (plotW <= 0) return;

      if (offsetX < plotLeft || offsetX > chartWidth - plotRightPad) {
        setHoverYear(null);
        return;
      }

      const t = (offsetX - plotLeft) / plotW;
      const [xMin, xMax] = xDomain;
      const yearFloat = xMin + t * (xMax - xMin);
      const closest = closestTickYear(yearFloat, xTickValues);
      if (closest != null) {
        setHoverYear(closest);
      }
    },
    [chartWidth, leftPadding, xDomain, xTickValues, setHoverYear]
  );

  const handleChartMouseLeave = useCallback(() => {
    setHoverYear(null);
  }, [setHoverYear]);

  const labelTickFormat = useMemo(() => {
    if (!yAxisLabels?.length) return () => "";
    const labelMap: Record<number, string> = Object.fromEntries(
      yAxisLabels.map((l) => [l.value, l.text])
    );
    return (t: number) => labelMap[t] || "";
  }, [yAxisLabels]);

  return (
    <div className="w-full">
      {/* Legend */}
      {showLegend && (
        <Legend
          series={series}
          order={legendOrder}
          getThemeColor={getThemeColor}
        />
      )}

      {/* Chart container */}
      <div
        ref={chartContainerRef}
        className="relative w-full cursor-crosshair"
        style={{ height }}
        onMouseMove={handleChartMouseMove}
        onMouseLeave={syncHover ? undefined : handleChartMouseLeave}
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
            {/* X-axis with year labels at bottom */}
            <VictoryAxis
              tickValues={xTickValues}
              tickFormat={(t: string | number) => String(t)}
              offsetY={35}
              style={{
                axis: { stroke: "transparent" },
                ticks: { stroke: "transparent" },
                tickLabels: {
                  fill: gridColor,
                  fontSize: 12,
                  fontWeight: 400,
                  fontFamily:
                    "var(--font-inter-variable), var(--font-inter), sans-serif",
                },
              }}
            />

            {/* Y-axis with dotted grid lines */}
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

            {/* Y-axis with custom text labels (no grid) */}
            {!!yAxisLabels?.length && (
              <VictoryAxis
                dependentAxis
                tickValues={labelTickValues}
                tickFormat={labelTickFormat}
                tickLabelComponent={
                  <CustomYAxisTickLabel
                    textColor={gridColor}
                    offsetX={14} // Distance from axis line
                    offsetY={-8} // Vertical fine-tuning
                    maxCharsPerLine={CUSTOM_Y_TICK_MAX_CHARS}
                    lineHeight={14} // Space between lines
                  />
                }
                style={{
                  axis: {
                    stroke: gridColor,
                    strokeDasharray: "1, 5",
                    strokeLinecap: "round",
                  },
                  ticks: { stroke: gridColor, size: 18 },
                  tickLabels: {}, // Styles handled by custom component
                  grid: { stroke: "transparent" },
                }}
              />
            )}

            {highlightYear != null && (
              <VictoryLine
                data={[
                  { x: highlightYear, y: yDomain[0] },
                  { x: highlightYear, y: yDomain[1] },
                ]}
                style={{
                  data: {
                    stroke: gridColor,
                    strokeWidth: 1,
                    strokeDasharray: "4 3",
                    opacity: 0.75,
                  },
                }}
              />
            )}

            {/* Render each line series */}
            {series.map((s) => {
              const colors = getSeriesColors(s.color, getThemeColor);
              const chartData = s.data.map((d) => ({
                x: d.year,
                y: d.value,
                ...d,
              }));

              return (
                <VictoryLine
                  key={s.id}
                  data={chartData}
                  style={{
                    data: {
                      stroke: colors.stroke,
                      strokeWidth: s.dashed ? 1.5 : 2,
                      ...(s.dashed && { strokeDasharray: "6, 4" }),
                    },
                  }}
                />
              );
            })}

            {/* Render scatter points for each series */}
            {series.map((s) => {
              const colors = getSeriesColors(s.color, getThemeColor);
              const chartData = s.data.map((d) => ({
                x: d.year,
                y: d.value,
                ...d,
              }));

              return (
                <VictoryScatter
                  key={`scatter-${s.id}`}
                  data={chartData}
                  dataComponent={
                    <DataPointCircle
                      strokeColor={colors.stroke}
                      fillColor={colors.fill}
                      isFilled={s.filled}
                      bgColor={bgColor}
                      radius={s.dotSize ?? (s.filled ? 6 : 7)}
                    />
                  }
                />
              );
            })}

            {/* Permanent labels: series with `showDataLabels` (unchanged vs pre-hover behavior) */}
            {series
              .filter((s) => s.showDataLabels)
              .map((s) => {
                const chartData = s.data.map((d) => ({
                  x: d.year,
                  y: d.value,
                  ...d,
                }));

                const pointR = s.dotSize ?? (s.filled ? 6 : 8);
                const lineColors = getSeriesColors(s.color, getThemeColor);

                return (
                  <VictoryScatter
                    key={`labels-always-${s.id}`}
                    data={chartData}
                    dataComponent={
                      <ChangeBadge
                        formatValue={formatYValue}
                        alwaysVisible
                        placement={s.dataLabelPlacement}
                        pointRadius={pointR}
                        lineColor={lineColors.stroke}
                        transparent={s.dataLabelTransparent}
                        groupClassName={s.dataLabelClassName}
                        rectClassName={s.dataLabelRectClassName}
                        textClassName={s.dataLabelTextClassName}
                      />
                    }
                  />
                );
              })}

            {/* Hover-only labels: `showDataLabels` unset only — explicit `false` skips hover too */}
            {highlightYear != null &&
              series
                .filter(
                  (s) => s.showDataLabels !== true && s.showDataLabels !== false
                )
                .map((s) => {
                  const chartData = s.data.map((d) => ({
                    x: d.year,
                    y: d.value,
                    ...d,
                  }));

                  const pointR = s.dotSize ?? (s.filled ? 6 : 8);
                  const lineColors = getSeriesColors(s.color, getThemeColor);

                  return (
                    <VictoryScatter
                      key={`labels-hover-${s.id}`}
                      data={chartData}
                      dataComponent={
                        <ChangeBadge
                          formatValue={formatYValue}
                          highlightYear={highlightYear}
                          placement={s.dataLabelPlacement}
                          pointRadius={pointR}
                          lineColor={lineColors.stroke}
                          transparent={s.dataLabelTransparent}
                          groupClassName={s.dataLabelClassName}
                          rectClassName={s.dataLabelRectClassName}
                          textClassName={s.dataLabelTextClassName}
                        />
                      }
                    />
                  );
                })}
          </VictoryChart>
        )}
      </div>
    </div>
  );
};

export default MultiLineRiskChart;
