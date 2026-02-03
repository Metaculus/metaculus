"use client";

import { range as d3Range } from "d3-array";
import { useCallback, useMemo, useState } from "react";
import {
  VictoryChart,
  VictoryScatter,
  VictoryAxis,
  VictoryLine,
  VictoryLabel,
  VictoryVoronoiContainer,
} from "victory";
import type { CallbackArgs } from "victory-core";

import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import { useBreakpoint } from "@/hooks/tailwind";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";

import { CollisionAwareLabels } from "./collision-aware-labels";
import { normalizeToCompany, isValidDate, toDate, safeIndex } from "./helpers";
import { ModelPoint } from "./mapping";

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

// Label font sizes (used for passing to CollisionAwareLabels)
const LABEL_FONT_SIZE_DESKTOP = 12;
const LABEL_FONT_SIZE_MOBILE = 10;

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
  const [hoveredPointKey, setHoveredPointKey] = useState<string | null>(null);

  // On small screens (< sm breakpoint), use smaller padding and font sizes
  const smUp = useBreakpoint("sm");
  const isSmallScreen = !smUp;
  const PADDING = isSmallScreen ? PADDING_SMALL_SCREEN : PADDING_DESKTOP;
  const domainPadding = { x: isSmallScreen ? 10 : 25, y: 20 };
  const labelFontSize = isSmallScreen
    ? LABEL_FONT_SIZE_MOBILE
    : LABEL_FONT_SIZE_DESKTOP;

  // Get container width for responsive chart
  const { ref: containerRef, width: containerWidth } =
    useContainerSize<HTMLDivElement>();
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
      const colorArray = Object.values(METAC_COLORS["mc-option"]);
      const colorKeys = Object.keys(METAC_COLORS["mc-option"]);

      const skippedIndexes = new Set([2]);
      const availableIndexes = colorKeys
        .map((_, i) => i)
        .filter((i) => !skippedIndexes.has(i));

      const availableIndexesLength = availableIndexes.length;
      const mappedIndex = idx % availableIndexesLength;
      const finalIndex = availableIndexes[mappedIndex] ?? 0;
      const chosen = colorArray[finalIndex] ?? METAC_COLORS["mc-option"][1];
      return getThemeColor(chosen);
    },
    [getThemeColor]
  );

  const colorForName = useCallback(
    (name: string) => {
      const group = normalizeToCompany(name);
      const idx = groupIndexByLabel.get(group);
      const finalIdx = typeof idx === "number" ? idx : 0;
      return colorFor({ index: finalIdx }) as string;
    },
    [groupIndexByLabel, colorFor]
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
      pointKey: `${item.name}-${+item.x}-${item.y}`,
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

  // Calculate domain - memoized to avoid recalculation on every render
  const { minX, maxX, minY, maxY } = useMemo(() => {
    const xValues = chartData.map((d) => d.x);
    const yValues = chartData.map((d) => d.y);
    const refScores = referenceLines.map((r) => r.y);
    return {
      minX: Math.min(...xValues),
      maxX: Math.max(...xValues),
      minY: Math.min(...yValues),
      maxY: Math.max(...yValues, ...refScores),
    };
  }, [chartData, referenceLines]);

  const yTicks = useMemo(() => {
    const step = 10;
    const start = Math.floor(minY / step) * step;
    const end = Math.ceil(maxY / step) * step;
    return d3Range(start, end + step, step);
  }, [minY, maxY]);

  // Calculate SOTA trend line (linear regression on max scores over time) - memoized
  const trendLineData = useMemo(() => {
    const sortedByDate = [...chartData].sort((a, b) => a.x - b.x);
    const sotaPoints: { x: number; y: number }[] = [];
    let maxScore = -Infinity;

    for (const point of sortedByDate) {
      if (point.y > maxScore) {
        maxScore = point.y;
        sotaPoints.push({ x: point.x, y: point.y });
      }
    }

    const xVals = sotaPoints.map((d) => d.x);
    const yVals = sotaPoints.map((d) => d.y);
    const n = xVals.length;

    if (n === 0) return [];

    const sumX = xVals.reduce((a, b) => a + b, 0);
    const sumY = yVals.reduce((a, b) => a + b, 0);
    const sumXY = xVals.reduce((total, x, i) => total + x * (yVals[i] ?? 0), 0);
    const sumX2 = xVals.reduce((total, x) => total + x * x, 0);
    const denominator = n * sumX2 - sumX * sumX;

    if (denominator === 0) return [];

    const slope = (n * sumXY - sumX * sumY) / denominator;
    const intercept = (sumY - slope * sumX) / n;

    return [
      { x: minX, y: slope * minX + intercept },
      { x: maxX, y: slope * maxX + intercept },
    ];
  }, [chartData, minX, maxX]);

  // Toggle provider selection - memoized to maintain stable reference
  const toggleProvider = useCallback((provider: string) => {
    setSelectedProviders((prev) => {
      const newSet = new Set(prev);
      if (newSet.has(provider)) {
        newSet.delete(provider);
      } else {
        newSet.add(provider);
      }
      return newSet;
    });
  }, []);

  // Check if a provider is highlighted (full opacity dots) - memoized
  // When hovering, the hovered provider AND any selected providers stay highlighted
  const isHighlighted = useCallback(
    (provider: string) => {
      if (hoveredProvider) {
        return provider === hoveredProvider || selectedProviders.has(provider);
      }
      return selectedProviders.size === 0 || selectedProviders.has(provider);
    },
    [hoveredProvider, selectedProviders]
  );

  // Prepare data with showLabel flag, opacity, and isSota flag - memoized
  // Show labels when:
  // 1. showAllLabels is true (show all), OR
  // 2. It's a SOTA model (only when not hovering a different provider), OR
  // 3. The provider is specifically selected in the legend (only when not hovering a different provider), OR
  // 4. The provider is hovered in the legend, OR
  // 5. The specific point is hovered
  const dataWithLabels = useMemo(() => {
    return chartData.map((d) => {
      const providerIsSelected = selectedProviders.has(d.provider);
      const providerIsHovered = hoveredProvider === d.provider;
      const isHoveredPointFlag = hoveredPointKey === d.pointKey;
      // When hovering a provider, only show labels for that provider (and hovered points)
      // Hide labels from selected/SOTA providers while hovering a different provider
      const showLabelWhenHovering = providerIsHovered || isHoveredPointFlag;
      const showLabelNormally =
        showAllLabels ||
        sotaModelNames.has(d.name) ||
        providerIsSelected ||
        isHoveredPointFlag;
      return {
        ...d,
        showLabel: hoveredProvider ? showLabelWhenHovering : showLabelNormally,
        isHighlighted: isHighlighted(d.provider),
        isSota: sotaModelNames.has(d.name),
        isHoveredPoint: isHoveredPointFlag,
      };
    });
  }, [
    chartData,
    selectedProviders,
    hoveredProvider,
    hoveredPointKey,
    showAllLabels,
    sotaModelNames,
    isHighlighted,
  ]);

  // Build legend items from data
  const legendItems = useMemo(() => {
    const companySet = new Set<string>();
    chartData.forEach((d) => {
      companySet.add(d.provider);
    });
    const providers = Array.from(companySet);
    const items = providers.map(
      (provider): { label: string; color: string } => {
        const idx = groupIndexByLabel.get(provider) ?? 0;
        return {
          label: provider,
          color: colorFor({ index: idx } as CallbackArgs) as string,
        };
      }
    );

    return items;
  }, [chartData, groupIndexByLabel, colorFor]);

  return (
    <div className={className ?? ""}>
      {/* Interactive Legend */}
      <div className="mb-4 flex flex-wrap items-center gap-1.5">
        {legendItems.map((item) => {
          const isSelected = selectedProviders.has(item.label);
          const isHovered = hoveredProvider === item.label;
          const isInactive =
            selectedProviders.size > 0 && !isSelected && !isHovered;
          const isDimmed = hoveredProvider !== null && !isHovered;
          const borderClasses = isSelected
            ? "border-2 border-blue-600 dark:border-blue-400"
            : isHovered
              ? "border-2 border-blue-400 dark:border-blue-600"
              : "border-2 border-transparent";
          const backgroundClasses = isInactive ? "bg-muted/50" : "bg-card";
          const opacityClass = isDimmed
            ? "opacity-35"
            : isInactive
              ? "opacity-50"
              : "";
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
              className={`flex items-center gap-2 rounded-full px-3 py-1.5 transition-all duration-150 ${borderClasses} ${backgroundClasses} ${opacityClass}`}
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
        onMouseLeave={() => setHoveredPointKey(null)}
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
            containerComponent={
              <VictoryVoronoiContainer
                voronoiBlacklist={[/^refLine-/, /^refLabel-/, "sotaTrend"]}
                radius={30}
                activateData
                onActivated={(points: { pointKey?: string }[]) => {
                  const point = points[0];
                  if (point?.pointKey) {
                    setHoveredPointKey(point.pointKey);
                  }
                }}
              />
            }
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
            {referenceLines.map((item, idx) => (
              <VictoryLine
                key={item.label}
                name={`refLine-${idx}`}
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
            {referenceLines.map((item, idx) => (
              <VictoryScatter
                key={`label-${item.label}`}
                name={`refLabel-${idx}`}
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
              name="sotaTrend"
              data={trendLineData}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS["mc-option"][3]),
                  strokeWidth: 1.5,
                  strokeDasharray: "6,5",
                },
              }}
            />

            {/* Dots - colored by option palette, stars for SOTA models */}
            <VictoryScatter
              name="points"
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
                      isHoveredPoint?: boolean;
                    };
                    return datum.isHighlighted || datum.isHoveredPoint
                      ? 1
                      : 0.25;
                  },
                  strokeOpacity: (args: CallbackArgs) => {
                    const datum = (args.datum ?? {}) as {
                      isHighlighted?: boolean;
                      isHoveredPoint?: boolean;
                    };
                    return datum.isHighlighted || datum.isHoveredPoint
                      ? 1
                      : 0.25;
                  },
                  cursor: "pointer",
                },
              }}
              labels={() => ""}
              labelComponent={
                <VictoryLabel style={{ opacity: 0, pointerEvents: "none" }} />
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
              labelFontSize={labelFontSize}
            />
          </VictoryChart>
        )}
      </div>
    </div>
  );
}

export default BenchmarkChart;
