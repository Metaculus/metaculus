"use client";

import * as d3 from "d3";
import { useCallback, useLayoutEffect, useMemo, useRef, useState } from "react";
import {
  VictoryChart,
  VictoryScatter,
  VictoryAxis,
  VictoryTooltip,
  VictoryLine,
  VictoryLabel,
} from "victory";
import type { CallbackArgs } from "victory-core";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import { useBreakpoint } from "@/hooks/tailwind";
import useAppTheme from "@/hooks/use_app_theme";
import type { ThemeColor } from "@/types/theme";

import { ModelPoint } from "./mapping";

// Hook to measure container width
function useContainerWidth() {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(0);

  useLayoutEffect(() => {
    const element = containerRef.current;
    if (!element) return;

    const updateWidth = () => {
      setWidth(element.offsetWidth);
    };

    updateWidth();
    const observer = new ResizeObserver(updateWidth);
    observer.observe(element);
    return () => observer.disconnect();
  }, []);

  return { containerRef, width };
}

type LegendItem =
  | { label: string; pointIndex: number }
  | { label: string; trend: true }
  | { label: string; sota: true };

type Props = {
  data: ModelPoint[];
  className?: string;
  legend?: LegendItem[];
  showAllLabels?: boolean;
  hideGpt35?: boolean;
};

// Chart dimensions
const CHART_HEIGHT_DESKTOP = 600;
const CHART_HEIGHT_MOBILE = 460;
const MIN_CHART_WIDTH = 400;
const PADDING_DESKTOP = { top: 30, bottom: 80, left: 50, right: 30 };
const PADDING_SMALL_SCREEN = { top: 30, bottom: 80, left: 35, right: 0 };

// Normalize model name to company/group name
const normalizeToCompany = (name: string) => {
  const first = String(name).split(" ")[0] ?? name;
  return /^gpt/i.test(first) ? "OpenAI" : first;
};

// Provider-specific color mapping - matching colors from design
// Colors are theme-aware with light (DEFAULT) and dark variants
const PROVIDER_COLORS: Record<string, ThemeColor> = {
  // OpenAI: Dark grey from design
  OpenAI: { DEFAULT: "#333333", dark: "#E4E7E9" },
  // Claude/Anthropic: Orange from design
  Claude: { DEFAULT: "#d97757", dark: "#F59E7A" },
  // DeepSeek: Vibrant blue from design
  DeepSeek: { DEFAULT: "#3E5EED", dark: "#5B7AF5" },
  // Qwen: Using similar blue (not in design, keeping distinctive)
  Qwen: { DEFAULT: "#06B6D4", dark: "#22D3EE" },
  // Gemini/Google: Medium green from design
  Gemini: { DEFAULT: "#54AC53", dark: "#6BC96A" },
  // Grok/xAI: Purple from design
  Grok: { DEFAULT: "#6A55BB", dark: "#8B75D4" },
  // LLaMA/Meta: Cyan/sky blue from design
  LLaMA: { DEFAULT: "#0099E5", dark: "#33B3F0" },
  // Kimi: Amber/orange from design
  Kimi: { DEFAULT: "#f59e0b", dark: "#FBBF24" },
  // Z.AI: Pink/magenta from design
  "Z.AI": { DEFAULT: "#ec4899", dark: "#F472B6" },
};

const LABEL_FONT_SIZE = 9;
const LABEL_FONT_FAMILY = "system-ui, sans-serif";
const LABEL_FONT_WEIGHT = 500;
const LABEL_STROKE_WIDTH = 2.5;
const LABEL_EDGE_PADDING = 6;
const LABEL_RECT_PADDING = LABEL_STROKE_WIDTH + 1;

const labelMeasureCanvas =
  typeof document !== "undefined" ? document.createElement("canvas") : null;

// Estimate text width using the actual label font.
function estimateTextWidth(text: string): number {
  if (!labelMeasureCanvas) return text.length * 5.5;
  const ctx = labelMeasureCanvas.getContext("2d");
  if (!ctx) return text.length * 5.5;
  ctx.font = `${LABEL_FONT_WEIGHT} ${LABEL_FONT_SIZE}px ${LABEL_FONT_FAMILY}`;
  return Math.ceil(ctx.measureText(text).width);
}

// Rectangle type for collision detection
type Rect = { x: number; y: number; width: number; height: number };

// Check if two rectangles overlap
function rectsOverlap(a: Rect, b: Rect, padding = 3): boolean {
  return !(
    a.x + a.width + padding < b.x ||
    b.x + b.width + padding < a.x ||
    a.y + a.height + padding < b.y ||
    b.y + b.height + padding < a.y
  );
}

function overlapArea(a: Rect, b: Rect): number {
  const x1 = Math.max(a.x, b.x);
  const y1 = Math.max(a.y, b.y);
  const x2 = Math.min(a.x + a.width, b.x + b.width);
  const y2 = Math.min(a.y + a.height, b.y + b.height);
  const w = x2 - x1;
  const h = y2 - y1;
  if (w <= 0 || h <= 0) return 0;
  return w * h;
}

// Safe bounds for labels (with padding from chart edges)
function getSafeBounds(
  padding: typeof PADDING_DESKTOP,
  chartWidth: number,
  chartHeight: number,
  edgePadding = 10
) {
  return {
    left: padding.left + edgePadding,
    right: chartWidth - padding.right - edgePadding,
    top: padding.top + edgePadding,
    bottom: chartHeight - padding.bottom - edgePadding,
  };
}

// Check if a rectangle is within the safe chart bounds
function isWithinBounds(
  rect: Rect,
  safeBounds: ReturnType<typeof getSafeBounds>
): boolean {
  return (
    rect.x >= safeBounds.left &&
    rect.x + rect.width <= safeBounds.right &&
    rect.y >= safeBounds.top &&
    rect.y + rect.height <= safeBounds.bottom
  );
}

// Label position options
const POSITIONS = [
  { dx: 6, dy: -4, anchor: "start" as const }, // right-up
  { dx: 6, dy: 4, anchor: "start" as const }, // right-down
  { dx: -6, dy: -4, anchor: "end" as const }, // left-up
  { dx: -6, dy: 4, anchor: "end" as const }, // left-down
  { dx: 0, dy: -10, anchor: "middle" as const }, // top
  { dx: 0, dy: 14, anchor: "middle" as const }, // bottom
  { dx: 12, dy: -8, anchor: "start" as const }, // far right-up
  { dx: -12, dy: -8, anchor: "end" as const }, // far left-up
  { dx: 12, dy: 8, anchor: "start" as const }, // far right-down
  { dx: -12, dy: 8, anchor: "end" as const }, // far left-down
  { dx: 20, dy: -12, anchor: "start" as const }, // farther right-up
  { dx: -20, dy: -12, anchor: "end" as const }, // farther left-up
  { dx: 20, dy: 12, anchor: "start" as const }, // farther right-down
  { dx: -20, dy: 12, anchor: "end" as const }, // farther left-down
  { dx: 0, dy: -18, anchor: "middle" as const }, // farther top
  { dx: 0, dy: 22, anchor: "middle" as const }, // farther bottom
  { dx: 36, dy: -20, anchor: "start" as const }, // extreme right-up
  { dx: -36, dy: -20, anchor: "end" as const }, // extreme left-up
  { dx: 36, dy: 20, anchor: "start" as const }, // extreme right-down
  { dx: -36, dy: 20, anchor: "end" as const }, // extreme left-down
  { dx: 0, dy: -26, anchor: "middle" as const }, // extreme top
  { dx: 0, dy: 30, anchor: "middle" as const }, // extreme bottom
  { dx: 44, dy: -24, anchor: "start" as const }, // max right-up
  { dx: -44, dy: -24, anchor: "end" as const }, // max left-up
  { dx: 44, dy: 24, anchor: "start" as const }, // max right-down
  { dx: -44, dy: 24, anchor: "end" as const }, // max left-down
];

const isValidDate = (d: Date) => !Number.isNaN(+d);
const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));
const safeIndex = (i: CallbackArgs["index"]) => (typeof i === "number" ? i : 0);

export function BenchmarkChart({
  data,
  legend,
  className,
  showAllLabels = false,
  hideGpt35 = false,
}: Props) {
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const [selectedProviders, setSelectedProviders] = useState<Set<string>>(
    new Set()
  );
  const [hoveredProvider, setHoveredProvider] = useState<string | null>(null);

  // On small screens (< sm breakpoint), use smaller padding and font sizes
  const smUp = useBreakpoint("sm");
  const isSmallScreen = !smUp;
  const PADDING = isSmallScreen ? PADDING_SMALL_SCREEN : PADDING_DESKTOP;
  const domainPadding = { x: isSmallScreen ? 10 : 25, y: 20 };

  // Get container width for responsive chart
  const { containerRef, width: containerWidth } = useContainerWidth();
  const chartWidth = Math.max(containerWidth, MIN_CHART_WIDTH);
  const chartHeight = isSmallScreen
    ? CHART_HEIGHT_MOBILE
    : CHART_HEIGHT_DESKTOP;

  // Color scheme matching pros-vs-bots chart
  const gridStroke = getThemeColor(METAC_COLORS.gray[500]);
  const axisLabelColor = getThemeColor(METAC_COLORS.gray[700]);
  const tickLabelColor = getThemeColor(METAC_COLORS.gray[500]);

  // Build color mapping from legend
  const groupIndexByLabel = useMemo(() => {
    const m = new Map<string, number>();
    (legend ?? []).forEach((item) => {
      if ("pointIndex" in item) m.set(item.label, item.pointIndex);
    });
    return m;
  }, [legend]);

  const colorFor = useCallback(
    (idxOrArgs: number | CallbackArgs) => {
      const idx =
        typeof idxOrArgs === "number" ? idxOrArgs : safeIndex(idxOrArgs.index);
      const chosen =
        Object.values(METAC_COLORS["mc-option"])[
          idx % Object.values(METAC_COLORS["mc-option"]).length
        ] ?? METAC_COLORS["mc-option"][1];
      return getThemeColor(chosen);
    },
    [getThemeColor]
  );

  const colorForName = useCallback(
    (name: string) => {
      const group = normalizeToCompany(name);
      // Check if provider has a specific color mapping
      if (PROVIDER_COLORS[group]) {
        return getThemeColor(PROVIDER_COLORS[group]);
      }
      // Otherwise, use theme-based colors
      const idx = groupIndexByLabel.get(group);
      return colorFor(
        typeof idx === "number" ? { index: idx } : { index: 0 }
      ) as string;
    },
    [groupIndexByLabel, colorFor, getThemeColor]
  );

  // Process data
  const referenceLines = useMemo(() => {
    const byKey = new Map<string, { y: number; label: string }>();
    for (const d of data) {
      if (!d.isAggregate) continue;
      const y = Number(d.score);
      if (!Number.isFinite(y)) continue;
      const key = d.aggregateKind ?? d.name;
      const prev = byKey.get(key);
      if (!prev || y < prev.y) byKey.set(key, { y, label: d.name });
    }
    return Array.from(byKey.values());
  }, [data]);

  const pointsAll = useMemo(() => {
    return data
      .map((d, i) => {
        const x = toDate(d.releaseDate);
        const y = Number(d.score);
        return {
          i,
          x,
          y,
          name: d.name,
          isAggregate: !!d.isAggregate,
        };
      })
      .filter((p) => isValidDate(p.x) && Number.isFinite(p.y));
  }, [data]);

  const plotPoints = useMemo(
    () => pointsAll.filter((p) => !data[p.i]?.isAggregate),
    [pointsAll, data]
  );

  // Filter out GPT-3.5 if hideGpt35 is true
  const filteredPlotPoints = useMemo(() => {
    if (!hideGpt35) return plotPoints;
    return plotPoints.filter((p) => p.name !== "GPT-3.5 Turbo");
  }, [plotPoints, hideGpt35]);

  // Transform data for Victory (convert dates to timestamps)
  const chartData = useMemo(() => {
    return filteredPlotPoints.map((item) => ({
      x: +item.x,
      y: item.y,
      name: item.name,
      label: `${item.name}\nScore: ${item.y.toFixed(2)}`,
      provider: normalizeToCompany(item.name),
    }));
  }, [filteredPlotPoints]);

  // Calculate SOTA models - models that were the best at their release time
  const sotaModels = useMemo(() => {
    const sorted = [...chartData].sort((a, b) => a.x - b.x);
    const sota: typeof chartData = [];
    let best = -Infinity;

    for (const point of sorted) {
      if (point.y > best) {
        sota.push(point);
        best = point.y;
      }
    }

    return sota;
  }, [chartData]);

  const sotaModelNames = useMemo(
    () => new Set(sotaModels.map((m) => m.name)),
    [sotaModels]
  );

  // Calculate domain
  const xValues = chartData.map((d) => d.x);
  const yValues = chartData.map((d) => d.y);
  const refScores = referenceLines.map((r) => r.y);
  const minX = Math.min(...xValues);
  const maxX = Math.max(...xValues);
  const minY = Math.min(...yValues);
  const maxY = Math.max(...yValues, ...refScores);
  const yTicks = useMemo(() => {
    const step = 10;
    const start = Math.floor(minY / step) * step;
    const end = Math.ceil(maxY / step) * step;
    return d3.range(start, end + step, step);
  }, [minY, maxY]);

  // Calculate SOTA trend line (linear regression on max scores over time)
  const sortedByDate = [...chartData].sort((a, b) => a.x - b.x);
  const sotaPoints: { x: number; y: number }[] = [];
  let maxScore = -Infinity;

  for (const point of sortedByDate) {
    if (point.y > maxScore) {
      maxScore = point.y;
      sotaPoints.push({ x: point.x, y: point.y });
    }
  }

  // Linear regression on SOTA points
  const xVals = sotaPoints.map((d) => d.x);
  const yVals = sotaPoints.map((d) => d.y);
  const n = xVals.length;
  const sumX = xVals.reduce((a, b) => a + b, 0);
  const sumY = yVals.reduce((a, b) => a + b, 0);
  const sumXY = xVals.reduce((total, x, i) => total + x * (yVals[i] ?? 0), 0);
  const sumX2 = xVals.reduce((total, x) => total + x * x, 0);
  const slope = (n * sumXY - sumX * sumY) / (n * sumX2 - sumX * sumX);
  const intercept = (sumY - slope * sumX) / n;

  const trendLineData = [
    { x: minX, y: slope * minX + intercept },
    { x: maxX, y: slope * maxX + intercept },
  ];

  // Toggle provider selection
  const toggleProvider = (provider: string) => {
    setSelectedProviders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(provider)) {
        newSet.delete(provider);
      } else {
        newSet.add(provider);
      }
      return newSet;
    });
  };

  // Check if a provider is highlighted (selected or none selected = all highlighted)
  // When hovering, only the hovered provider is highlighted
  const isHighlighted = (provider: string) => {
    if (hoveredProvider) {
      return provider === hoveredProvider;
    }
    return selectedProviders.size === 0 || selectedProviders.has(provider);
  };

  // Prepare data with showLabel flag, opacity, and isSota flag
  // Show labels when:
  // 1. showAllLabels is true (show all), OR
  // 2. It's a SOTA model, OR
  // 3. The provider is specifically selected in the legend, OR
  // 4. The provider is hovered in the legend
  const dataWithLabels = chartData.map((d) => {
    const providerIsSelected = selectedProviders.has(d.provider);
    const providerIsHovered = hoveredProvider === d.provider;
    return {
      ...d,
      showLabel:
        showAllLabels ||
        sotaModelNames.has(d.name) ||
        providerIsSelected ||
        providerIsHovered,
      isHighlighted: isHighlighted(d.provider),
      isSota: sotaModelNames.has(d.name),
    };
  });

  // Build legend items from data
  const legendItems = useMemo(() => {
    const companySet = new Set<string>();
    chartData.forEach((d) => {
      companySet.add(d.provider);
    });
    return Array.from(companySet).map(
      (provider): { label: string; color: string } => {
        // Use provider-specific color if available, otherwise use theme-based color
        const providerColor = PROVIDER_COLORS[provider];
        if (providerColor) {
          return {
            label: provider,
            color: getThemeColor(providerColor),
          };
        }
        const idx = groupIndexByLabel.get(provider) ?? 0;
        return {
          label: provider,
          color: colorFor({ index: idx } as CallbackArgs) as string,
        };
      }
    );
  }, [chartData, groupIndexByLabel, colorFor, getThemeColor]);

  return (
    <div className={className ?? ""}>
      {/* Interactive Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {legendItems.map((item) => {
          const isSelected = selectedProviders.has(item.label);
          const isHovered = hoveredProvider === item.label;
          const isActive =
            selectedProviders.size === 0 || isSelected || isHovered;
          return (
            <button
              key={item.label}
              onClick={() => toggleProvider(item.label)}
              onPointerEnter={(event) => {
                if (event.pointerType === "mouse") {
                  setHoveredProvider(item.label);
                }
              }}
              onPointerLeave={(event) => {
                if (event.pointerType === "mouse") {
                  setHoveredProvider(null);
                }
              }}
              className={`flex items-center gap-2 rounded-full border px-3 py-1.5 transition-all ${
                isActive
                  ? "border-border bg-card shadow-sm"
                  : "bg-muted/50 border-transparent opacity-50"
              } hover:border-border hover:opacity-100`}
            >
              <span
                className="h-3 w-3 rounded-full"
                style={{ backgroundColor: item.color }}
              />
              <span className="text-foreground text-xs font-medium">
                {item.label}
              </span>
            </button>
          );
        })}
        {selectedProviders.size > 0 && (
          <button
            onClick={() => setSelectedProviders(new Set())}
            className="text-muted-foreground hover:text-foreground px-2 py-1 text-xs underline"
          >
            Clear selection
          </button>
        )}
      </div>

      {/* Reference benchmarks and SOTA legend */}
      <div className="mb-4 flex items-center gap-6 text-sm">
        <div className="flex items-center gap-2">
          <svg width="32" height="2" className="shrink-0">
            <line
              x1="0"
              y1="1"
              x2="32"
              y2="1"
              stroke={getThemeColor(METAC_COLORS["mc-option"][3])}
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
          </svg>
          <span
            style={{ color: getThemeColor(METAC_COLORS["mc-option"][3]) }}
            className="font-medium"
          >
            SOTA Trend
          </span>
        </div>
        <div className="flex items-center gap-2">
          <svg width="32" height="2" className="shrink-0">
            <line
              x1="0"
              y1="1"
              x2="32"
              y2="1"
              stroke={getThemeColor(METAC_COLORS.purple[700])}
              strokeWidth="1.5"
              strokeDasharray="4,3"
            />
          </svg>
          <span
            style={{ color: getThemeColor(METAC_COLORS.purple[700]) }}
            className="font-medium"
          >
            Reference Benchmarks
          </span>
        </div>
      </div>

      <div
        ref={containerRef}
        className="relative w-full"
        style={{ minHeight: chartHeight }}
      >
        {containerWidth === 0 ? (
          <div className="h-[460px] w-full animate-pulse rounded-md bg-gray-200 dark:bg-gray-800 sm:h-[600px]" />
        ) : (
          <VictoryChart
            width={chartWidth}
            height={chartHeight}
            theme={chartTheme}
            padding={PADDING}
            domainPadding={domainPadding}
            domain={{
              x: [minX, maxX],
              y: [minY, maxY],
            }}
          >
            {/* X Axis - Date - positioned at bottom */}
            <VictoryAxis
              orientation="bottom"
              offsetY={PADDING.bottom}
              tickFormat={(t: number) => {
                const date = new Date(t);
                return `${date.toLocaleString("default", { month: "short" })} '${String(date.getFullYear()).slice(2)}`;
              }}
              tickCount={10}
              style={{
                axis: {
                  stroke: "transparent",
                },
                ticks: { stroke: "transparent" },
                tickLabels: {
                  fontSize: isSmallScreen ? 10 : 12,
                  fill: tickLabelColor,
                  angle: -45,
                  textAnchor: "end",
                  fontFamily: "system-ui, sans-serif",
                },
                grid: {
                  stroke: gridStroke,
                  strokeDasharray: "3,3",
                  strokeWidth: 1,
                  opacity: 0.25,
                },
              }}
              label="Release Date"
              axisLabelComponent={
                <VictoryLabel
                  dy={35}
                  style={{
                    fontSize: isSmallScreen ? 10 : 13,
                    fill: axisLabelColor,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 500,
                  }}
                />
              }
            />

            {/* Y Axis - Score (smaller sizes on small screens) */}
            <VictoryAxis
              dependentAxis={true}
              style={{
                axis: {
                  stroke: "transparent",
                },
                ticks: { stroke: "transparent" },
                tickLabels: {
                  fontSize: isSmallScreen ? 10 : 12,
                  fill: tickLabelColor,
                  fontFamily: "system-ui, sans-serif",
                  fontFeatureSettings: '"tnum"',
                },
                grid: {
                  stroke: gridStroke,
                  strokeDasharray: "3,3",
                  strokeWidth: 1,
                  opacity: 0.25,
                },
              }}
              tickValues={yTicks}
              label="Score"
              axisLabelComponent={
                <VictoryLabel
                  angle={-90}
                  dy={isSmallScreen ? 0 : -10}
                  dx={-10}
                  style={{
                    fontSize: isSmallScreen ? 10 : 13,
                    fill: axisLabelColor,
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 500,
                  }}
                />
              }
            />

            {/* Reference benchmark horizontal dotted lines */}
            {referenceLines.map((item) => (
              <VictoryLine
                key={item.label}
                data={[
                  { x: minX, y: item.y },
                  { x: maxX, y: item.y },
                ]}
                style={{
                  data: {
                    stroke: getThemeColor(METAC_COLORS.purple[700]),
                    strokeWidth: 1.5,
                    opacity: 1,
                    strokeDasharray: "6,5",
                  },
                }}
              />
            ))}

            {/* Reference benchmark labels - positioned at end of lines */}
            {referenceLines.map((item) => (
              <VictoryScatter
                key={`label-${item.label}`}
                data={[{ x: maxX, y: item.y }]}
                size={0}
                style={{ data: { opacity: 0 } }}
                labels={[item.label]}
                labelComponent={
                  <VictoryLabel
                    dx={2}
                    dy={-6}
                    textAnchor="end"
                    style={{
                      fontSize: isSmallScreen ? 10 : 12,
                      fontFamily: "system-ui, sans-serif",
                      fontWeight: 600,
                      fill: getThemeColor(METAC_COLORS.purple[700]),
                    }}
                  />
                }
              />
            ))}

            {/* SOTA Trend Line */}
            <VictoryLine
              data={trendLineData}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS["mc-option"][3]),
                  strokeWidth: 1.5,
                  strokeDasharray: "6,5",
                },
              }}
            />

            {/* Dots - colored by provider, stars for SOTA models */}
            <VictoryScatter
              data={dataWithLabels}
              size={(args: CallbackArgs) => {
                const datum = (args.datum ?? {}) as { isSota?: boolean };
                return datum.isSota ? 5 : 4;
              }}
              symbol={(args: CallbackArgs) => {
                const datum = (args.datum ?? {}) as { isSota?: boolean };
                return datum.isSota ? "star" : "circle";
              }}
              style={{
                data: {
                  fill: (args: CallbackArgs) => {
                    const datum = (args.datum ?? {}) as { name: string };
                    return colorForName(datum.name ?? "");
                  },
                  stroke: (args: CallbackArgs) => {
                    const datum = (args.datum ?? {}) as { name: string };
                    return colorForName(datum.name ?? "");
                  },
                  strokeWidth: 1,
                  fillOpacity: (args: CallbackArgs) => {
                    const datum = (args.datum ?? {}) as {
                      isHighlighted?: boolean;
                    };
                    return datum.isHighlighted ? 1 : 0.15;
                  },
                  strokeOpacity: (args: CallbackArgs) => {
                    const datum = (args.datum ?? {}) as {
                      isHighlighted?: boolean;
                    };
                    return datum.isHighlighted ? 1 : 0.15;
                  },
                  cursor: "pointer",
                },
              }}
              labels={({ datum }) => datum.label}
              labelComponent={
                <VictoryTooltip
                  flyoutStyle={{
                    stroke: getThemeColor(METAC_COLORS.gray[400]),
                    strokeWidth: 1,
                    fill: getThemeColor(METAC_COLORS.gray[0]),
                    filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.1))",
                  }}
                  style={{
                    fontSize: 11,
                    fill: getThemeColor(METAC_COLORS.gray[800]),
                    fontFamily: "system-ui, sans-serif",
                    fontWeight: 500,
                  }}
                  cornerRadius={6}
                  pointerLength={8}
                  flyoutPadding={{ top: 8, bottom: 8, left: 12, right: 12 }}
                />
              }
            />

            {/* Custom labels layer with collision detection */}
            <CollisionAwareLabels
              data={dataWithLabels}
              xDomain={[minX, maxX]}
              yDomain={[minY, maxY]}
              colorForName={colorForName}
              getThemeColor={getThemeColor}
              padding={PADDING}
              chartWidth={chartWidth}
              chartHeight={chartHeight}
              domainPadding={domainPadding}
            />
          </VictoryChart>
        )}
      </div>
    </div>
  );
}

// Collision-aware labels component - renders as a Victory child to get access to scale
function CollisionAwareLabels(props: {
  data: Array<{
    x: number;
    y: number;
    name: string;
    provider: string;
    isHighlighted: boolean;
    showLabel: boolean;
  }>;
  xDomain: [number, number];
  yDomain: [number, number];
  colorForName: (name: string) => string;
  getThemeColor: (color: { DEFAULT: string; dark: string }) => string;
  padding: typeof PADDING_DESKTOP;
  chartWidth: number;
  chartHeight: number;
  domainPadding: { x: number; y: number };
}) {
  const {
    data,
    xDomain,
    yDomain,
    colorForName,
    getThemeColor,
    padding,
    chartWidth,
    chartHeight,
    domainPadding,
  } = props;
  if (!data || data.length === 0) return null;
  const defaultPosition = POSITIONS[0];
  if (!defaultPosition) return null;

  // Calculate scale functions from domain to pixel
  // Victory passes scale when this is a child of VictoryChart
  const plotWidth = chartWidth - padding.left - padding.right;
  const plotHeight = chartHeight - padding.top - padding.bottom;
  const domainPadX = domainPadding.x;
  const domainPadY = domainPadding.y;

  // Calculate manually
  const scaleX = (val: number) => {
    const ratio = (val - xDomain[0]) / (xDomain[1] - xDomain[0]);
    return padding.left + domainPadX + ratio * (plotWidth - 2 * domainPadX);
  };
  const scaleY = (val: number) => {
    const ratio = (val - yDomain[0]) / (yDomain[1] - yDomain[0]);
    return (
      chartHeight -
      padding.bottom -
      domainPadY -
      ratio * (plotHeight - 2 * domainPadY)
    );
  };

  // Safe bounds for label placement
  const safeBounds = getSafeBounds(
    padding,
    chartWidth,
    chartHeight,
    LABEL_EDGE_PADDING + LABEL_STROKE_WIDTH
  );

  // Convert data to pixel coordinates
  const points = data.map((datum) => ({
    x: scaleX(datum.x),
    y: scaleY(datum.y),
    datum,
  }));

  // Now compute label positions with collision detection
  const placedRects: Rect[] = [];
  const DOT_RADIUS = 4;

  // Add all highlighted dots as obstacles first
  for (const p of points) {
    if (p.datum.isHighlighted) {
      placedRects.push({
        x: p.x - DOT_RADIUS - 2,
        y: p.y - DOT_RADIUS - 2,
        width: (DOT_RADIUS + 2) * 2,
        height: (DOT_RADIUS + 2) * 2,
      });
    }
  }

  // Compute labels for highlighted points that should show labels
  const labelsToRender: Array<{
    x: number;
    y: number;
    labelX: number;
    labelY: number;
    anchor: string;
    name: string;
    color: string;
  }> = [];

  // Sort by y pixel (lower y = higher on screen = higher score = priority)
  const sortedPoints = [...points]
    .filter((p) => p.datum.showLabel && p.datum.isHighlighted)
    .sort((a, b) => a.y - b.y);

  const clampLabelPosition = (
    labelX: number,
    labelY: number,
    anchor: string,
    textWidth: number,
    textHeight: number
  ) => {
    let rectX =
      anchor === "end"
        ? labelX - textWidth
        : anchor === "middle"
          ? labelX - textWidth / 2
          : labelX;
    let rectY = labelY - textHeight / 2;

    let paddedRectX = rectX - LABEL_RECT_PADDING;
    let paddedRectY = rectY - LABEL_RECT_PADDING;
    const paddedWidth = textWidth + 2 * LABEL_RECT_PADDING;
    const paddedHeight = textHeight + 2 * LABEL_RECT_PADDING;

    if (paddedRectX < safeBounds.left) {
      paddedRectX = safeBounds.left;
    }
    if (paddedRectX + paddedWidth > safeBounds.right) {
      paddedRectX = safeBounds.right - paddedWidth;
    }
    if (paddedRectY < safeBounds.top) {
      paddedRectY = safeBounds.top;
    }
    if (paddedRectY + paddedHeight > safeBounds.bottom) {
      paddedRectY = safeBounds.bottom - paddedHeight;
    }

    rectX = paddedRectX + LABEL_RECT_PADDING;
    rectY = paddedRectY + LABEL_RECT_PADDING;

    return {
      labelX:
        anchor === "end"
          ? rectX + textWidth
          : anchor === "middle"
            ? rectX + textWidth / 2
            : rectX,
      labelY: rectY + textHeight / 2,
    };
  };

  for (const p of sortedPoints) {
    const textWidth = estimateTextWidth(p.datum.name);
    const textHeight = LABEL_FONT_SIZE + 2;
    const color = colorForName(p.datum.name);

    let bestPos = defaultPosition;
    let finalLabelX = 0;
    let finalLabelY = 0;
    let bestRect: Rect | null = null;
    let bestOverlapScore = Number.POSITIVE_INFINITY;

    for (const pos of POSITIONS) {
      let labelX = p.x + pos.dx;
      let labelY = p.y + pos.dy;
      const clamped = clampLabelPosition(
        labelX,
        labelY,
        pos.anchor,
        textWidth,
        textHeight
      );
      labelX = clamped.labelX;
      labelY = clamped.labelY;

      let rectX: number;
      if (pos.anchor === "end") {
        rectX = labelX - textWidth;
      } else if (pos.anchor === "middle") {
        rectX = labelX - textWidth / 2;
      } else {
        rectX = labelX;
      }
      const rectY = labelY - textHeight / 2;

      const candidate: Rect = {
        x: rectX - LABEL_RECT_PADDING,
        y: rectY - LABEL_RECT_PADDING,
        width: textWidth + 2 * LABEL_RECT_PADDING,
        height: textHeight + 2 * LABEL_RECT_PADDING,
      };

      // Check both collision with other labels/dots AND boundary constraints
      const overlappingRects = placedRects.filter((r) =>
        rectsOverlap(candidate, r)
      );
      const overlapCount = overlappingRects.length;
      const overlapPenalty =
        overlapCount === 0
          ? 0
          : overlappingRects.reduce(
              (sum, r) => sum + overlapArea(candidate, r),
              0
            );
      const withinBounds = isWithinBounds(candidate, safeBounds);

      if (!withinBounds) continue;
      if (overlapCount === 0) {
        bestPos = pos;
        bestRect = candidate;
        finalLabelX = labelX;
        finalLabelY = labelY;
        bestOverlapScore = 0;
        break;
      }

      const score = overlapCount * 1_000_000 + overlapPenalty;
      if (score < bestOverlapScore) {
        bestOverlapScore = score;
        bestPos = pos;
        bestRect = candidate;
        finalLabelX = labelX;
        finalLabelY = labelY;
      }
    }

    if (!bestRect) {
      continue;
    }

    const finalPos = bestPos;
    placedRects.push(bestRect);
    labelsToRender.push({
      x: p.x,
      y: p.y,
      labelX: finalLabelX,
      labelY: finalLabelY,
      anchor: finalPos.anchor,
      name: p.datum.name,
      color,
    });
  }

  return (
    <g>
      {/* Render labels with leader lines */}
      {labelsToRender.map((label, i) => {
        // Calculate where leader line connects to label (close to label text)
        const lineEndX =
          label.anchor === "end"
            ? label.labelX + 2
            : label.anchor === "start"
              ? label.labelX - 2
              : label.labelX;

        return (
          <g key={`label-${i}`}>
            {/* Leader line */}
            <line
              x1={label.x}
              y1={label.y}
              x2={lineEndX}
              y2={label.labelY}
              stroke={label.color}
              strokeWidth={0.75}
              strokeOpacity={0.7}
            />
            {/* Theme-aware outline */}
            <text
              x={label.labelX}
              y={label.labelY}
              textAnchor={label.anchor}
              dominantBaseline="middle"
              fill={getThemeColor(METAC_COLORS.gray[0])}
              stroke={getThemeColor(METAC_COLORS.gray[0])}
              strokeWidth={LABEL_STROKE_WIDTH}
              fontSize={LABEL_FONT_SIZE}
              fontFamily={LABEL_FONT_FAMILY}
              fontWeight={LABEL_FONT_WEIGHT}
            >
              {label.name}
            </text>
            {/* Colored label */}
            <text
              x={label.labelX}
              y={label.labelY}
              textAnchor={label.anchor}
              dominantBaseline="middle"
              fill={label.color}
              fontSize={LABEL_FONT_SIZE}
              fontFamily={LABEL_FONT_FAMILY}
              fontWeight={LABEL_FONT_WEIGHT}
            >
              {label.name}
            </text>
          </g>
        );
      })}
    </g>
  );
}

export default BenchmarkChart;
