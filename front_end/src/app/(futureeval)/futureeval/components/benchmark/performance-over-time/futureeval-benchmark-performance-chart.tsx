"use client";

import {
  faArrowsLeftRight,
  faArrowsUpDown,
  faXmark,
} from "@fortawesome/free-solid-svg-icons";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import classNames from "classnames";
import { useTranslations } from "next-intl";
import { FC, useMemo, useState, useCallback } from "react";
import {
  VictoryAxis,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryVoronoiContainer,
} from "victory";
import type { CallbackArgs } from "victory-core";

import EdgeAwareLabel from "@/components/charts/edge_aware_label";
import { darkTheme, lightTheme } from "@/constants/chart_theme";
import { METAC_COLORS } from "@/constants/colors";
import { useBreakpoint } from "@/hooks/tailwind";
import useAppTheme from "@/hooks/use_app_theme";
import useContainerSize from "@/hooks/use_container_size";
import { getYMeta } from "@/utils/charts/axis";
import { fitTrend } from "@/utils/charts/helpers";

import { ModelPoint } from "./mapping";

type LegendItem =
  | { label: string; pointIndex: number }
  | { label: string; trend: true }
  | { label: string; sota: true };

type Props = { data: ModelPoint[]; className?: string; legend?: LegendItem[] };

const isValidDate = (d: Date) => !Number.isNaN(+d);
const toDate = (v: Date | string) => (v instanceof Date ? v : new Date(v));

const FutureEvalBenchmarkPerformanceChart: FC<Props> = ({
  data,
  legend,
  className,
}) => {
  const t = useTranslations();
  const { ref: wrapRef, width } = useContainerSize<HTMLDivElement>();
  const { theme, getThemeColor } = useAppTheme();
  const chartTheme = theme === "dark" ? darkTheme : lightTheme;
  const smUp = useBreakpoint("sm");
  const REF_STROKE = getThemeColor(METAC_COLORS.purple[700]);

  // State for legend interactivity
  const [hoveredCompany, setHoveredCompany] = useState<string | null>(null);
  const [selectedCompany, setSelectedCompany] = useState<string | null>(null);

  const handleCompanyHover = useCallback((company: string | null) => {
    setHoveredCompany(company);
  }, []);

  const handleCompanyClick = useCallback((company: string) => {
    setSelectedCompany((prev) => (prev === company ? null : company));
  }, []);

  const handleDeselectCompany = useCallback(() => {
    setSelectedCompany(null);
  }, []);

  // Normalize model name to company/group name
  const normalizeToCompany = useCallback((name: string) => {
    const first = String(name).split(" ")[0] ?? name;
    return /^gpt/i.test(first) ? "OpenAI" : first;
  }, []);

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

  const rightPad = referenceLines.length ? 64 : 40;

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

  const sotaPoints = useMemo(() => {
    const pts = [...plotPoints].sort((a, b) => +a.x - +b.x);
    const result: typeof plotPoints = [];
    let best = -Infinity;
    for (const p of pts) {
      if (p.y > best) {
        result.push(p);
        best = p.y;
      }
    }
    return result;
  }, [plotPoints]);

  // Filter SOTA points for labels/stars based on selected company
  // (labels/stars only show for selected company when one is active)
  const filteredSotaPoints = useMemo(() => {
    if (!selectedCompany) return sotaPoints;
    return sotaPoints.filter(
      (p) => normalizeToCompany(p.name) === selectedCompany
    );
  }, [sotaPoints, selectedCompany, normalizeToCompany]);

  const yMeta = useMemo(() => {
    const vals = [
      ...plotPoints.map((p) => p.y),
      ...referenceLines.map((r) => r.y),
    ];
    return getYMeta(vals, { gridlines: GRIDLINES, padMin: 2, padRatio: 0.1 });
  }, [plotPoints, referenceLines]);

  const xDomain = useMemo<[Date, Date]>(() => {
    if (plotPoints.length === 0) {
      const now = new Date();
      return [now, now];
    }
    const xs = plotPoints.map((p) => +p.x);
    const min = new Date(Math.min(...xs));
    const max = new Date(Math.max(...xs));
    return [min, max];
  }, [plotPoints]);

  const targetTicks = smUp ? 5 : 3;

  const timeTicks = useMemo<Date[]>(() => {
    const [min, max] = xDomain;
    return buildTimeTicks(min, max, targetTicks);
  }, [xDomain, targetTicks]);

  const xDomainAligned = useMemo<[Date, Date]>(() => {
    const [dataMin, dataMax] = xDomain;
    const firstTick = timeTicks[0] ?? dataMin;
    const first = firstTick < dataMin ? dataMin : firstTick;
    const lastTick = timeTicks[timeTicks.length - 1] ?? dataMax;
    const last = lastTick < dataMax ? dataMax : lastTick;
    return [first, last];
  }, [timeTicks, xDomain]);

  // Minimum points required to show trend line
  const MIN_TREND_POINTS = 3;

  // Trend line - hide when a company is selected
  const trend = useMemo(() => {
    // Don't show trend line when a company is selected
    if (selectedCompany) return null;

    // Prefer SOTA points if available, otherwise use all points
    const base = sotaPoints.length >= 2 ? sotaPoints : plotPoints;

    // Don't show trend line if not enough points
    if (base.length < MIN_TREND_POINTS) return null;

    return fitTrend(
      base.map((p) => ({ x: p.x as Date, y: p.y as number })),
      yMeta
    );
  }, [sotaPoints, plotPoints, selectedCompany, yMeta]);

  const groupIndexByLabel = useMemo(() => {
    const m = new Map<string, number>();
    (legend ?? []).forEach((item) => {
      if ("pointIndex" in item) m.set(item.label, item.pointIndex);
    });
    return m;
  }, [legend]);

  const colorForName = (name: string) => {
    const group = normalizeToCompany(name);
    const idx = groupIndexByLabel.get(group);
    return colorFor(
      typeof idx === "number" ? { index: idx } : { index: 0 }
    ) as string;
  };

  const colorFor = (idxOrArgs: number | CallbackArgs) => {
    const idx =
      typeof idxOrArgs === "number" ? idxOrArgs : safeIndex(idxOrArgs.index);
    const chosen =
      Object.values(METAC_COLORS["mc-option"])[
        idx % Object.values(METAC_COLORS["mc-option"]).length
      ] ?? METAC_COLORS["mc-option"][1];
    return getThemeColor(chosen);
  };

  const labelText = (d: { name?: string }) => d?.name ?? " ";
  const labelStyle = {
    fontSize: smUp ? 16 : 12,
    fontFamily: 'interVariable, "interVariable Fallback", inter',
    fontWeight: 400,
    fill: (args: CallbackArgs) =>
      colorForName((args.datum as { name?: string })?.name || ""),
    pointerEvents: "none" as const,
    userSelect: "none" as const,
    cursor: "default",
  };
  const edgePadLeft = smUp ? 50 : 8;
  const edgePadRight = smUp ? rightPad : 8;
  const pointKey = (p: { x: Date; y: number; name: string }) =>
    `${+p.x}|${p.y}|${p.name}`;

  // Use sotaPoints for labeled set (not filtered) since we show all dots
  const allSotaKeySet = useMemo(
    () => new Set(sotaPoints.map(pointKey)),
    [sotaPoints]
  );

  // Labeled key set for SOTA labels/stars (filtered when company selected)
  const labeledKeySet = useMemo(
    () => new Set(filteredSotaPoints.map(pointKey)),
    [filteredSotaPoints]
  );

  // Add company info to each point for rendering
  const enrichedPlotPoints = useMemo(
    () =>
      plotPoints.map((p) => {
        const key = pointKey(p);
        const company = normalizeToCompany(p.name);
        const isSelectedCompany = selectedCompany
          ? company === selectedCompany
          : null;
        const isSota = allSotaKeySet.has(key);
        return {
          ...p,
          _key: key,
          _company: company,
          _isSota: isSota,
          _isSelectedCompany: isSelectedCompany,
          // Only apply legend hover highlighting when no company is selected
          _isHoveredCompany: selectedCompany
            ? null
            : hoveredCompany
              ? company === hoveredCompany
              : null,
        };
      }),
    [
      plotPoints,
      selectedCompany,
      hoveredCompany,
      normalizeToCompany,
      allSotaKeySet,
    ]
  );

  // Calculate opacity for a point based on hover/selection state
  const getPointOpacity = (point: {
    _isSota?: boolean;
    _isSelectedCompany?: boolean | null;
    _isHoveredCompany?: boolean | null;
  }) => {
    // If a company is selected
    if (point._isSelectedCompany !== null) {
      // Selected company's dots are 100%, other companies are 20%
      return point._isSelectedCompany ? 1 : 0.2;
    }

    // If a company is hovered in the legend
    if (point._isHoveredCompany !== null) {
      return point._isHoveredCompany ? 1 : 0.35;
    }

    // Default: SOTA points are full opacity, others are dimmed
    return point._isSota ? 1 : 0.35;
  };

  // Calculate opacity for star markers based on hover/selection state
  const getStarOpacity = useCallback(
    (name: string) => {
      const company = normalizeToCompany(name);

      // If a company is selected
      if (selectedCompany) {
        // Selected company's stars are 100%, other companies are 20%
        return company === selectedCompany ? 1 : 0.2;
      }

      // If a company is hovered in the legend
      if (hoveredCompany) {
        return company === hoveredCompany ? 1 : 0.35;
      }

      return 1;
    },
    [selectedCompany, hoveredCompany, normalizeToCompany]
  );

  // Count dots per company
  const companyDotCounts = useMemo(() => {
    const counts = new Map<string, number>();
    for (const p of plotPoints) {
      const company = normalizeToCompany(p.name);
      counts.set(company, (counts.get(company) ?? 0) + 1);
    }
    return counts;
  }, [plotPoints, normalizeToCompany]);

  // Check if selected company has few dots (< 3)
  const selectedCompanyHasFewDots = useMemo(() => {
    if (!selectedCompany) return false;
    const count = companyDotCounts.get(selectedCompany) ?? 0;
    return count < 3;
  }, [selectedCompany, companyDotCounts]);

  // Get all points for selected company (for labeling when few dots)
  const selectedCompanyPoints = useMemo(() => {
    if (!selectedCompany || !selectedCompanyHasFewDots) return [];
    return plotPoints.filter(
      (p) => normalizeToCompany(p.name) === selectedCompany
    );
  }, [
    plotPoints,
    selectedCompany,
    selectedCompanyHasFewDots,
    normalizeToCompany,
  ]);

  // Data for hover detection
  // When a company is selected, only that company's dots should be hoverable
  const hoverDetectionPoints = useMemo(() => {
    // Filter to only selected company's dots when one is selected
    const pointsToUse = selectedCompany
      ? plotPoints.filter((p) => normalizeToCompany(p.name) === selectedCompany)
      : plotPoints;

    return pointsToUse.map((p) => {
      const key = pointKey(p);
      const company = normalizeToCompany(p.name);
      const isSelectedCompanyDot =
        selectedCompany && company === selectedCompany;

      // Suppress hover for:
      // 1. SOTA points (they have permanent labels)
      // 2. All selected company dots when company has < 3 dots (they show all labels)
      const suppressHover =
        labeledKeySet.has(key) ||
        (isSelectedCompanyDot && selectedCompanyHasFewDots);

      return {
        ...p,
        _key: key,
        suppressHover,
      };
    });
  }, [
    plotPoints,
    labeledKeySet,
    selectedCompany,
    selectedCompanyHasFewDots,
    normalizeToCompany,
  ]);

  // Separate company legend items from trend/sota items
  const companyLegendItems = useMemo(
    () => (legend ?? []).filter((item) => "pointIndex" in item),
    [legend]
  );
  const trendLegendItems = useMemo(
    () => (legend ?? []).filter((item) => "trend" in item || "sota" in item),
    [legend]
  );

  return (
    <div ref={wrapRef} className={className ?? "relative w-full"}>
      {/* Legend above the chart */}
      {legend?.length ? (
        <div className="mb-4 flex flex-wrap items-center justify-start gap-x-[14px] gap-y-2 antialiased sm:gap-x-8 sm:gap-y-3">
          {/* Company legend items (interactive) - hidden on mobile */}
          {smUp &&
            companyLegendItems.map((item, i) =>
              "pointIndex" in item ? (
                <LegendDot
                  key={`legend-dot-${i}`}
                  color={
                    colorFor({
                      index: item.pointIndex,
                    } as unknown as CallbackArgs) as string
                  }
                  label={item.label}
                  isHovered={hoveredCompany === item.label}
                  isSelected={selectedCompany === item.label}
                  isDimmed={
                    hoveredCompany !== null && hoveredCompany !== item.label
                  }
                  onHover={handleCompanyHover}
                  onClick={handleCompanyClick}
                  onDeselect={handleDeselectCompany}
                />
              ) : null
            )}
          {/* Spacer for double gap before trend items - only needed on desktop */}
          {smUp && trendLegendItems.length > 0 && (
            <span className="w-8" aria-hidden />
          )}
          {/* Trend/SOTA legend items (non-interactive) */}
          {trendLegendItems.map((item, i) =>
            "trend" in item ? (
              <LegendTrend
                key={`legend-trend-${i}`}
                color={getThemeColor(METAC_COLORS["mc-option"][3])}
                label={item.label}
                isDimmed={selectedCompany !== null}
              />
            ) : (
              <LegendStar key={`legend-sota-${i}`} label={item.label} />
            )
          )}
          {/* Mobile-only axis legends (shown when company legends are hidden) */}
          {!smUp && (
            <>
              <LegendAxisIcon
                icon={faArrowsUpDown}
                label={t("aibScore")}
                color={getThemeColor(METAC_COLORS.gray[500])}
              />
              <LegendAxisIcon
                icon={faArrowsLeftRight}
                label={t("aibModelReleaseDate")}
                color={getThemeColor(METAC_COLORS.gray[500])}
              />
            </>
          )}
        </div>
      ) : null}

      {width === 0 && <div style={{ height: smUp ? 360 : 220 }} />}
      {width > 0 && (
        <VictoryChart
          width={width}
          height={smUp ? 360 : 220}
          theme={chartTheme}
          scale={{ x: "time" }}
          domain={{ x: xDomainAligned, y: [yMeta.lo - 0.5, yMeta.hi + 0.5] }}
          domainPadding={{ x: 24 }}
          padding={{
            top: 16,
            bottom: smUp ? 68 : 36,
            left: smUp ? 50 : 8,
            right: smUp ? rightPad : 8,
          }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiBlacklist={[
                "bgPoints",
                "labelsLayer",
                "allLabelsLayer",
                "points",
                "trend",
                "refLine",
                "refLabel",
                "sotaStars",
              ]}
              radius={30}
              activateData
              style={{ touchAction: "pan-y" }}
              labels={({
                datum,
              }: {
                datum: { name?: string; suppressHover?: boolean };
              }) => (datum?.suppressHover ? undefined : datum?.name ?? " ")}
              labelComponent={
                <EdgeAwareLabel
                  chartWidth={width}
                  padLeft={edgePadLeft}
                  padRight={edgePadRight}
                  minGap={10}
                  fontSizePx={smUp ? 16 : 12}
                  dy={8}
                  style={labelStyle}
                />
              }
            />
          }
        >
          <VictoryAxis
            dependentAxis
            label={smUp ? t("aibScore") : undefined}
            axisLabelComponent={
              <VictoryLabel angle={-90} dx={-10} dy={smUp ? -10 : 10} />
            }
            tickValues={yMeta.ticks}
            tickFormat={smUp ? (d: number) => Math.round(d) : () => ""}
            style={{
              grid: {
                stroke: getThemeColor(METAC_COLORS.gray[500]),
                strokeWidth: 1,
                opacity: 0.15,
              },
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fill: getThemeColor(METAC_COLORS.gray[500]),
                fontSize: smUp ? 12 : 10,
                fontWeight: 400,
                fontFeatureSettings: '"tnum"',
              },
              axisLabel: {
                fill: getThemeColor(METAC_COLORS.gray[700]),
                fontSize: 14,
                fontWeight: 400,
              },
            }}
          />

          <VictoryAxis
            orientation="bottom"
            crossAxis={false}
            label={smUp ? t("aibModelReleaseDate") : undefined}
            axisLabelComponent={<VictoryLabel dy={28} />}
            tickFormat={(d: Date) =>
              d.toLocaleDateString(undefined, {
                month: "short",
                year: "numeric",
              })
            }
            offsetY={smUp ? 68 : 36}
            tickValues={timeTicks}
            tickLabelComponent={
              <VictoryLabel dy={smUp ? 16 : 8} textAnchor="middle" />
            }
            style={{
              axis: { stroke: "transparent" },
              ticks: { stroke: "transparent" },
              tickLabels: {
                fill: getThemeColor(METAC_COLORS.gray[500]),
                fontSize: smUp ? 12 : 10,
              },
              axisLabel: {
                fill: getThemeColor(METAC_COLORS.gray[700]),
                fontSize: 16,
              },
              grid: { stroke: "transparent" },
            }}
          />

          {referenceLines.map((rl, i) => (
            <VictoryLine
              key={`ref-${i}`}
              data={[
                { x: xDomainAligned[0], y: rl.y },
                { x: xDomainAligned[1], y: rl.y },
              ]}
              style={{
                data: {
                  stroke: REF_STROKE,
                  strokeWidth: 1.5,
                  opacity: 1,
                  strokeDasharray: "6,5",
                },
              }}
            />
          ))}
          {referenceLines.map((rl, i) => (
            <VictoryScatter
              key={`ref-label-${i}`}
              data={[{ x: xDomainAligned[1], y: rl.y }]}
              size={0}
              labels={[rl.label]}
              labelComponent={
                <VictoryLabel
                  dx={4}
                  textAnchor="end"
                  style={{
                    fontFamily:
                      'interVariable, "interVariable Fallback", inter',
                    fontWeight: 600,
                    fill: getThemeColor(METAC_COLORS.purple[700]),
                  }}
                />
              }
            />
          ))}

          <VictoryScatter
            name="hoverPoints"
            data={hoverDetectionPoints}
            x="x"
            y="y"
            size={14}
            style={{ data: { opacity: 0 } }}
          />

          {trend && (
            <VictoryLine
              name="trend"
              data={trend}
              style={{
                data: {
                  stroke: getThemeColor(METAC_COLORS["mc-option"][3]),
                  strokeWidth: 1.5,
                  strokeDasharray: "6,5",
                },
              }}
            />
          )}

          <VictoryScatter
            name="bgPoints"
            data={enrichedPlotPoints}
            x="x"
            y="y"
            size={14}
            style={{ data: { opacity: 0 } }}
          />

          <VictoryScatter
            name="points"
            data={enrichedPlotPoints}
            x="x"
            y="y"
            size={5}
            style={{
              data: {
                fill: (args: CallbackArgs) =>
                  colorForName((args.datum as { name: string }).name),
                opacity: (args: CallbackArgs) => {
                  const d = args.datum as {
                    _isSota?: boolean;
                    _isSelectedCompany?: boolean | null;
                    _isHoveredCompany?: boolean | null;
                  };
                  return getPointOpacity(d);
                },
              },
            }}
          />

          {/* Labels for SOTA points (filtered by selected company when one is active) */}
          {/* Only show when company is not selected OR selected company has >= 3 dots */}
          {(!selectedCompany || !selectedCompanyHasFewDots) && (
            <VictoryScatter
              name="labelsLayer"
              data={filteredSotaPoints}
              x="x"
              y="y"
              size={6}
              labels={({ datum }) => labelText(datum as { name?: string })}
              labelComponent={
                <EdgeAwareLabel
                  chartWidth={width}
                  padLeft={edgePadLeft}
                  padRight={edgePadRight}
                  minGap={10}
                  fontSizePx={smUp ? 16 : 12}
                  dy={8}
                  style={{
                    ...labelStyle,
                    opacity: (args: CallbackArgs) =>
                      getStarOpacity(
                        (args.datum as { name?: string })?.name || ""
                      ),
                  }}
                />
              }
              style={{ data: { opacity: 0 } }}
            />
          )}

          {/* Labels for ALL points when selected company has < 3 dots */}
          {selectedCompanyHasFewDots && (
            <VictoryScatter
              name="allLabelsLayer"
              data={selectedCompanyPoints}
              x="x"
              y="y"
              size={6}
              labels={({ datum }) => labelText(datum as { name?: string })}
              labelComponent={
                <EdgeAwareLabel
                  chartWidth={width}
                  padLeft={edgePadLeft}
                  padRight={edgePadRight}
                  minGap={10}
                  fontSizePx={smUp ? 16 : 12}
                  dy={8}
                  style={labelStyle}
                />
              }
              style={{ data: { opacity: 0 } }}
            />
          )}

          {/* SOTA stars - show filtered set based on selection */}
          <VictoryScatter
            name="sotaStars"
            data={filteredSotaPoints}
            x="x"
            y="y"
            size={7}
            symbol="star"
            style={{
              data: {
                fill: ({ datum }) =>
                  colorForName((datum as { name: string }).name),
                stroke: getThemeColor(METAC_COLORS.gray[0]),
                strokeWidth: 0.5,
                opacity: ({ datum }) =>
                  getStarOpacity((datum as { name: string }).name),
              },
            }}
          />
        </VictoryChart>
      )}
    </div>
  );
};

type LegendDotProps = {
  color: string;
  label: string;
  isHovered?: boolean;
  isSelected?: boolean;
  isDimmed?: boolean;
  onHover?: (company: string | null) => void;
  onClick?: (company: string) => void;
  onDeselect?: () => void;
};

const LegendDot: FC<LegendDotProps> = ({
  color,
  label,
  isHovered = false,
  isSelected = false,
  isDimmed = false,
  onHover,
  onClick,
  onDeselect,
}) => {
  // Toggle behavior: select when not selected, deselect when selected
  const handleClick = () => {
    if (isSelected) {
      onDeselect?.();
    } else {
      onClick?.(label);
    }
  };

  return (
    <button
      type="button"
      aria-pressed={isSelected}
      aria-label={isSelected ? `Deselect ${label}` : `Select ${label}`}
      className={classNames(
        "inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 transition-all duration-150",
        "focus:outline-none focus-visible:ring-2 focus-visible:ring-blue-500",
        {
          // Selected state: blue-600 border in light mode, blue-400 in dark mode
          "border-2 border-blue-600 dark:border-blue-400": isSelected,
          // Hover state (not selected): blue-400 border in light mode, blue-600 in dark mode
          "border-2 border-blue-400 dark:border-blue-600":
            isHovered && !isSelected,
          // Default state: transparent border
          "border-2 border-transparent": !isHovered && !isSelected,
          // Dimmed when another company is hovered
          "opacity-35": isDimmed,
        }
      )}
      onMouseEnter={() => onHover?.(label)}
      onMouseLeave={() => onHover?.(null)}
      onClick={handleClick}
    >
      <span
        aria-hidden
        className="inline-block h-[14px] w-[14px] rounded-full"
        style={{ backgroundColor: color }}
      />
      <span className="text-xs text-gray-900 dark:text-gray-900-dark sm:text-base sm:text-lg">
        {label}
      </span>
      {isSelected && (
        <span
          aria-hidden
          className="ml-0.5 inline-flex h-4 w-4 items-center justify-center rounded-full text-gray-600 dark:text-gray-400"
        >
          <FontAwesomeIcon icon={faXmark} className="h-3 w-3" />
        </span>
      )}
    </button>
  );
};

const LegendTrend: FC<{ color: string; label: string; isDimmed?: boolean }> = ({
  color,
  label,
  isDimmed = false,
}) => (
  <span
    className={classNames("inline-flex items-center gap-1.5", {
      "opacity-35": isDimmed,
    })}
  >
    <span className="relative inline-block h-[3px] w-5">
      <span
        aria-hidden
        className="absolute left-0 top-1/2 w-full -translate-y-1/2"
        style={{ borderTop: `2px dashed ${color}` }}
      />
    </span>
    <span className="text-xs text-gray-900 dark:text-gray-900-dark sm:text-base sm:text-lg">
      {label}
    </span>
  </span>
);

const LegendStar: FC<{ label: string }> = ({ label }) => (
  <span className="inline-flex items-center gap-1.5">
    <span
      aria-hidden
      className="inline-flex h-[14px] w-[14px] items-center justify-center"
      title="SOTA"
    >
      <span className="text-base leading-none">★</span>
    </span>
    <span className="text-xs text-gray-900 dark:text-gray-900-dark sm:text-base sm:text-lg">
      {label}
    </span>
  </span>
);

const LegendAxisIcon: FC<{
  icon: typeof faArrowsLeftRight;
  label: string;
  color: string;
}> = ({ icon, label, color }) => (
  <span className="inline-flex items-center gap-1.5">
    <FontAwesomeIcon
      icon={icon}
      className="h-[14px] w-[14px]"
      style={{ color }}
      aria-hidden
    />
    <span className="text-xs text-gray-900 dark:text-gray-900-dark sm:text-base sm:text-lg">
      {label}
    </span>
  </span>
);

const GRIDLINES = 5;
const safeIndex = (i: CallbackArgs["index"]) => (typeof i === "number" ? i : 0);
function buildTimeTicks(min: Date, max: Date, target: number): Date[] {
  const monthDiff =
    (max.getFullYear() - min.getFullYear()) * 12 +
    (max.getMonth() - min.getMonth());
  const steps = [1, 2, 3, 4, 6, 12];
  const step = steps.find((s) => Math.ceil(monthDiff / s) + 1 <= target) ?? 12;
  const start = new Date(
    min.getFullYear(),
    Math.floor(min.getMonth() / step) * step,
    1
  );

  const ticks: Date[] = [];
  for (
    let d = new Date(start);
    d <= max;
    d = new Date(d.getFullYear(), d.getMonth() + step, 1)
  ) {
    ticks.push(d);
  }
  if (ticks.length === 0 || +(ticks[ticks.length - 1] ?? 0) < +max) {
    ticks.push(new Date(max.getFullYear(), max.getMonth(), 1));
  }
  return ticks;
}

export default FutureEvalBenchmarkPerformanceChart;
