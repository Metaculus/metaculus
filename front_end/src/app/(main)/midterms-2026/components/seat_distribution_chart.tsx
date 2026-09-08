"use client";

import { useTranslations } from "next-intl";
import { FC, useCallback, useId, useMemo, useRef, useState } from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
  VictoryScatter,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory";

import useContainerSize from "@/hooks/use_container_size";
import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import { getDiscreteValueOptions } from "@/utils/formatters/prediction";
import {
  cdfToPmf,
  computeQuartilesFromCDF,
  scaleInternalLocation,
} from "@/utils/math";

import { MIDTERMS_COLORS } from "../constants";
import { useIsDark } from "../helpers/use_is_dark";

type Props = {
  post: PostWithForecasts;
  /** Forecast-values CDF to render instead of the question's default CP — e.g.
   *  the Medalists aggregation. Falls back to the default CP when omitted. */
  cdfOverride?: number[];
  /** Detach the open-bound "landslide" bins (the first/last sentinels) with a
   *  gap + divider line and a ">N seat advantage" tooltip. House only. */
  separateOutOfBounds?: boolean;
  /** Localized "Democrat Seat Advantage" label rendered below the x-axis. */
  demAdvantageLabel: string;
  /** Localized "Republican Seat Advantage" label rendered below the x-axis. */
  repAdvantageLabel: string;
  /** Localized "EVEN" label rendered at x=0 on the Discrete (Senate) chart. */
  evenLabel: string;
  /** Accessible name for the chart. */
  ariaTitle: string;
};

// Fixed height; width is measured from the container so the SVG renders at
// its true pixel size (no CSS down-scaling => crisp fonts/strokes). This is
// the same technique the shared ContinuousAreaChart uses via useContainerSize.
const CHART_HEIGHT = 300;
const CHART_PADDING = { top: 16, right: 8, bottom: 56, left: 38 };
const DISCRETE_DOMAIN_PADDING_X = 10;

// Shared text style for every piece of SVG text inside the chart so the
// rendered fonts match the rest of the page (Inter via the CSS variables
// registered in the root layout).
const TEXT_FONT_FAMILY =
  "var(--font-inter-variable), var(--font-inter), Inter, system-ui, sans-serif";
const AXIS_FONT_SIZE = 12;
const NEUTRAL_GRAY_FILL_LIGHT = "#D1D5DB";
const NEUTRAL_GRAY_FILL_DARK = "#475569";

// EVEN center bar (Senate) — tweak its fill + label color here.
const EVEN_BAR_FILL_LIGHT = "#7d818a";
const EVEN_BAR_FILL_DARK = "#475569";
// The EVEN label now sits above the bin on the chart background, so it uses a
// color that reads on the background (inverted from the old on-bar white).
const EVEN_TEXT_COLOR_LIGHT = "#475569";
const EVEN_TEXT_COLOR_DARK = "#E2E8F0";
// Length (px) of the connector line from the EVEN label down to the bin top.
const EVEN_CONNECTOR_PX = 8;
// How far (in inbound-bin steps) to push the out-of-bounds "landslide" bins
// beyond the last real outcome, opening a gap for the divider line. Tunable.
const OOB_GAP_STEPS = 2;
// Fraction of the chart's vertical height the out-of-bounds divider lines span.
const OOB_DIVIDER_HEIGHT_FRAC = 0.5;

// House on-hover vertical bar — tweak its color / thickness / opacity here.
const HOVER_BAR_COLOR_LIGHT = "#334155";
const HOVER_BAR_COLOR_DARK = "#E2E8F0";
const HOVER_BAR_WIDTH = 1;
const HOVER_BAR_ACTIVE_OPACITY = 0.75;

// Shared flyout geometry for both the hover tooltip and the median callout.
const TOOLTIP_FLYOUT_PADDING = { top: 11, bottom: 10, left: 12, right: 12 };
const TOOLTIP_CORNER_RADIUS = 6;
const TOOLTIP_POINTER_LENGTH = 10;
const HOVER_FLYOUT_OPACITY = 0.9;
// Per-line line-heights for the hover tooltip's two lines. The second value is
// bumped over the first to open ~2px more gap between them (line 2 is 14px, so
// 1.3 -> 1.44 moves its baseline 18.2px -> 20.2px).
const HOVER_TOOLTIP_LINE_HEIGHTS: [number, number] = [1.3, 1.44];

// Median callout. The flyout inverts against the page — black on light, white on
// dark — so the party inks have to invert too: the light page needs the *light*
// party swatch to read on its black flyout, and the dark page needs the darker
// one on white. That's the opposite of every other party color in this file,
// which is why these don't reuse demFill / demStroke.
const MEDIAN_INK_LIGHT = "#000000";
const MEDIAN_INK_DARK = "#ffffff";
const MEDIAN_FLYOUT_OPACITY = 0.8;
const MEDIAN_FONT_SIZE = 14;
const MEDIAN_MARKER_SIZE = 4;
const MEDIAN_MARKER_STROKE_WIDTH = 1.5;

type Point = { x: number; y: number };

/**
 * One-line, two-ink tooltip label: "Median:" in the flyout's foreground color
 * followed by the seat value in its party color. VictoryLabel's array API only
 * stacks lines vertically, so the two runs need to be sibling tspans here.
 * VictoryTooltip still sizes its flyout from the concatenated `text` prop it was
 * given, so auto-sizing keeps working.
 */
const MedianTooltipLabel: FC<{
  x?: number;
  y?: number;
  labelText: string;
  valueText: string;
  labelFill: string;
  valueFill: string;
}> = ({ x, y, labelText, valueText, labelFill, valueFill }) => (
  <text
    x={x}
    y={y}
    textAnchor="middle"
    dominantBaseline="central"
    style={{
      fontFamily: TEXT_FONT_FAMILY,
      fontSize: MEDIAN_FONT_SIZE,
      fontWeight: 700,
    }}
  >
    {/* Non-breaking space so the SVG renderer can't collapse the gap between
        the two runs. */}
    <tspan fill={labelFill}>{`${labelText} `}</tspan>
    <tspan fill={valueFill} style={{ fontVariantNumeric: "tabular-nums" }}>
      {valueText}
    </tspan>
  </text>
);

const SeatDistributionChart: FC<Props> = ({
  post,
  cdfOverride,
  separateOutOfBounds,
  demAdvantageLabel,
  repAdvantageLabel,
  evenLabel,
  ariaTitle,
}) => {
  const t = useTranslations();
  const isDark = useIsDark();
  const { ref: containerRef, width: containerWidth } =
    useContainerSize<HTMLDivElement>();
  // Unique gradient ids — declared before any early return so the useId hook
  // stays in the same order across renders.
  const reactId = useId().replace(/:/g, "");
  const fillGradientId = `seat-fill-${reactId}`;
  const strokeGradientId = `seat-stroke-${reactId}`;
  // The median callout is a default-state affordance: it yields the moment a bin
  // is hovered so it never stacks with the hover tooltip.
  const [isBinHovered, setIsBinHovered] = useState(false);
  // Victory's voronoi handleMouseMove calls onActivated(newPoints) and then
  // onDeactivated(previousPoints) back-to-back in the same tick whenever the
  // active bin changes. Without this flag the paired onDeactivated would
  // immediately undo every activation and the callout would never hide. Only the
  // genuine clears — pointer out of bounds, or off the container — arrive
  // without a preceding activation.
  const justActivatedRef = useRef(false);
  const handleBinActivated = useCallback((points: unknown[]) => {
    const active = points.length > 0;
    justActivatedRef.current = active;
    setIsBinHovered(active);
  }, []);
  const handleBinDeactivated = useCallback(() => {
    if (justActivatedRef.current) {
      justActivatedRef.current = false;
      return;
    }
    setIsBinHovered(false);
  }, []);
  const handlePointerLeave = useCallback(() => {
    justActivatedRef.current = false;
    setIsBinHovered(false);
  }, []);

  const question = post.question as QuestionWithNumericForecasts | undefined;

  const data = useMemo(() => {
    if (!question) return null;
    const cdf =
      cdfOverride ??
      question.aggregations?.[question.default_aggregation_method]?.latest
        ?.forecast_values;
    if (!cdf || cdf.length < 2) return null;

    const pmf = cdfToPmf(cdf);
    const { range_min, range_max } = question.scaling;
    if (range_min === null || range_max === null) return null;
    const inbound_outcome_count = question.inbound_outcome_count ?? 0;
    const discreteOptions = getDiscreteValueOptions(question);
    const isDiscrete = question.type === QuestionType.Discrete;

    const step = (range_max - range_min) / (inbound_outcome_count - 1);
    let domainMin = range_min - step / 2;
    let domainMax = range_max + step / 2;
    const bins: Point[] = [
      domainMin,
      ...(discreteOptions ?? []),
      domainMax,
    ].map((x, j) => ({ x, y: (pmf[j] ?? 0) * 100 }));

    // The index mapping above requires the CDF at native bin resolution
    // (one value per inbound outcome, plus the two open-bound tails). If the
    // question serves a finer grid, bars would be silently wrong — render the
    // unavailable placeholder instead.
    if (isDiscrete && pmf.length !== bins.length) return null;

    // Out-of-bounds (landslide) separation — House only. The first/last bins are
    // the open-bound tails; push them outward to open a gap, and record a
    // divider-line x in each gap. Identified from the live config, not hardcoded.
    let leftDividerX: number | null = null;
    let rightDividerX: number | null = null;
    if (
      separateOutOfBounds &&
      isDiscrete &&
      discreteOptions &&
      discreteOptions.length >= 2 &&
      bins.length >= 3
    ) {
      const optMin = discreteOptions[0] ?? 0;
      const optMax = discreteOptions[discreteOptions.length - 1] ?? 0;
      const optStep =
        (discreteOptions[1] ?? 0) - (discreteOptions[0] ?? 0) || step;
      const leftOobX = optMin - OOB_GAP_STEPS * optStep;
      const rightOobX = optMax + OOB_GAP_STEPS * optStep;
      const first = bins[0];
      const last = bins[bins.length - 1];
      if (first && last) {
        bins[0] = { ...first, x: leftOobX };
        bins[bins.length - 1] = { ...last, x: rightOobX };
      }
      leftDividerX = optMin - (OOB_GAP_STEPS / 2) * optStep;
      rightDividerX = optMax + (OOB_GAP_STEPS / 2) * optStep;
      domainMin = leftOobX - optStep / 2;
      domainMax = rightOobX + optStep / 2;
    }

    const curve: Point[] = bins;

    const yOnCurve = (x: number): number => {
      if (!pmf.length) return 0;
      const first = curve[0] as Point;
      const last = curve[curve.length - 1] as Point;
      if (x <= first.x) return first.y;
      if (x >= last.x) return last.y;
      for (let i = 1; i < curve.length; i++) {
        const b = curve[i] as Point;
        if (x <= b.x) {
          const a = curve[i - 1] as Point;
          const span = b.x - a.x || 1;
          return a.y + ((x - a.x) / span) * (b.y - a.y);
        }
      }
      return last.y;
    };

    // Whole-number points that drive the House tooltip + hover bar. Their
    // height tracks the smooth curve so the hover bar reaches (but doesn't
    // exceed) the distribution.
    const houseTooltipPoints: Point[] = [];
    if (!isDiscrete) {
      for (let s = range_min; s <= range_max; s++) {
        houseTooltipPoints.push({ x: s, y: yOnCurve(s) });
      }
    }

    const quartiles = computeQuartilesFromCDF(cdf, false, isDiscrete);
    const quartileXs = {
      median: scaleInternalLocation(quartiles.median, question.scaling),
      lower25: scaleInternalLocation(quartiles.lower25, question.scaling),
      upper75: scaleInternalLocation(quartiles.upper75, question.scaling),
    };
    const quartileYs = {
      median: yOnCurve(quartileXs.median),
      lower25: yOnCurve(quartileXs.lower25),
      upper75: yOnCurve(quartileXs.upper75),
    };

    const series = isDiscrete ? bins : curve;
    const dataMinX = series[0]?.x ?? domainMin;
    const dataMaxX = series[series.length - 1]?.x ?? domainMax;
    const maxY = series.length ? Math.max(...series.map((p) => p.y)) : 0;

    return {
      bins,
      curve,
      houseTooltipPoints,
      domainMin,
      domainMax,
      isDiscrete,
      quartileXs,
      quartileYs,
      dataMinX,
      dataMaxX,
      maxY,
      rangeMin: range_min,
      rangeMax: range_max,
      leftDividerX,
      rightDividerX,
    };
  }, [question, cdfOverride, separateOutOfBounds]);

  if (!data || !question) return null;

  const {
    bins,
    curve,
    houseTooltipPoints,
    domainMin,
    domainMax,
    isDiscrete,
    quartileXs,
    quartileYs,
    dataMinX,
    dataMaxX,
    maxY,
    rangeMin,
    rangeMax,
    leftDividerX,
    rightDividerX,
  } = data;
  const chartWidth = containerWidth;

  // The "even" bin — the seat bucket at x=0. On Senate it renders as a
  // standalone neutral-gray bar; on House x=0 is only the color split.
  const evenBin = bins.find((b) => b.x === 0) ?? null;
  const negBins = bins.filter((b) => b.x < 0);
  const posBins = bins.filter((b) => b.x > 0);

  // Theme-aware color tokens.
  const demFill = isDark
    ? MIDTERMS_COLORS.demPrimaryDark
    : MIDTERMS_COLORS.demPrimary;
  const demStroke = isDark
    ? MIDTERMS_COLORS.demPrimaryDark
    : MIDTERMS_COLORS.demBorder;
  const repFill = isDark
    ? MIDTERMS_COLORS.repPrimaryDark
    : MIDTERMS_COLORS.repPrimary;
  const repStroke = isDark
    ? MIDTERMS_COLORS.repPrimaryDark
    : MIDTERMS_COLORS.repBorder;
  const axisColor = isDark ? "#94A3B8" : "#475569";
  const tickColor = isDark ? "#CBD5E1" : "#334155";
  const neutralFill = isDark ? EVEN_BAR_FILL_DARK : EVEN_BAR_FILL_LIGHT;
  const hoverBarColor = isDark ? HOVER_BAR_COLOR_DARK : HOVER_BAR_COLOR_LIGHT;
  const evenTextColor = isDark ? EVEN_TEXT_COLOR_DARK : EVEN_TEXT_COLOR_LIGHT;
  const chartBg = isDark
    ? MIDTERMS_COLORS.cardBgDark
    : MIDTERMS_COLORS.cardBgLight;

  // Median callout. Both questions are Discrete, so the median lands on an
  // integer bin center and the marker snaps to a bar rather than floating
  // between two. Negative = Dem advantage, positive = Rep (see data.ts).
  const medianInk = isDark ? MEDIAN_INK_DARK : MEDIAN_INK_LIGHT;
  const medianLabelFill = isDark ? "#262f38" : "#ffffff";
  const medianSeats = Math.round(quartileXs.median);
  // Zero needs its own wording: it belongs to neither party, and without a branch
  // it falls through to the Republican string as "R +0 seats" in red. It lands on
  // the EVEN bin, which does state a different thing (that bar is
  // P(advantage = 0); the median is where the CDF crosses 50%) — the callout is
  // shown at every median regardless.
  const medianLabelText = t("midtermsHubMedianLabel");
  const medianValueText =
    medianSeats === 0
      ? t("midtermsHubMedianEven")
      : medianSeats < 0
        ? t("midtermsHubMedianDem", { count: Math.abs(medianSeats) })
        : t("midtermsHubMedianRep", { count: medianSeats });
  // Keyed off the flyout's own background, not the page: the light page's black
  // flyout needs the *Dark* swatches (the pair designed to read on dark
  // surfaces), and the dark page's white flyout needs the darker Border pair.
  // Zero takes the label's own ink — party colors would assert a lean that isn't
  // there.
  const medianValueFill =
    medianSeats === 0
      ? medianLabelFill
      : medianSeats < 0
        ? isDark
          ? MIDTERMS_COLORS.demBorder
          : MIDTERMS_COLORS.demPrimaryDark
        : isDark
          ? MIDTERMS_COLORS.repBorder
          : MIDTERMS_COLORS.repPrimaryDark;

  const BAR_FILL_OPACITY = 0.7;
  const BAR_FILL_OPACITY_HOVER = 1;
  const AREA_FILL_OPACITY = 0.5;
  const AREA_STROKE_WIDTH = 1.4;

  const plotInnerWidth = chartWidth - CHART_PADDING.left - CHART_PADDING.right;

  // On narrow (mobile) widths give the axis more bottom room so the
  // (often two-line) party-advantage labels clear the numeric ticks.
  const isNarrow = !!chartWidth && chartWidth < 480;
  const chartPadding = isNarrow
    ? { ...CHART_PADDING, bottom: 66 }
    : CHART_PADDING;

  // Explicit bar width derived from the available plot area divided by the
  // bin count, so every integer bar is identical (Victory's barRatio
  // auto-sizing is non-uniform when the scale carries a non-null zero_point).
  const barWidth =
    bins.length > 0
      ? Math.max(2, Math.floor((plotInnerWidth / bins.length) * 0.92))
      : undefined;

  // Where x=0 falls inside the rendered data's bounding box, as a 0-1
  // fraction. SVG gradients use objectBoundingBox units, so this must be
  // relative to the rendered extent, not the full chart domain.
  const zeroFraction =
    dataMaxX === dataMinX ? 0.5 : (0 - dataMinX) / (dataMaxX - dataMinX);
  const zeroStopPct = `${(zeroFraction * 100).toFixed(2)}%`;

  // X-axis ticks — for discrete questions, sampled only from actual bin x-values
  // (bins[1..-2], excluding the half-integer domain edge sentinels). For the
  // continuous case, evenly spaced whole numbers with edges pinned to ceil/floor
  // of the half-integer range bounds.
  const axisMin = Math.ceil(domainMin);
  const axisMax = Math.floor(domainMax);
  const tickCount = 6;
  const visibleDiscreteXs = isDiscrete ? bins.slice(1, -1).map((b) => b.x) : [];

  let xTicks: number[];
  if (isDiscrete && visibleDiscreteXs.length > 0) {
    const total = visibleDiscreteXs.length;
    const tickIndices = new Set<number>([0, total - 1]);
    for (let i = 1; i < tickCount; i++) {
      tickIndices.add(Math.round(((total - 1) * i) / tickCount));
    }
    const zeroIdx = visibleDiscreteXs.indexOf(0);
    if (zeroIdx >= 0) tickIndices.add(zeroIdx);
    xTicks = Array.from(tickIndices)
      .sort((a, b) => a - b)
      .map((i) => visibleDiscreteXs[i])
      .filter((x): x is number => x !== undefined);
  } else {
    const innerTicks: number[] = [0];
    for (let i = 1; i < tickCount; i++) {
      innerTicks.push((domainMin * i) / tickCount);
      innerTicks.push((domainMax * i) / tickCount);
    }
    xTicks = Array.from(
      new Set(
        innerTicks
          .map((tk) => Math.round(tk))
          .filter((tk) => tk > axisMin && tk < axisMax)
          .concat([axisMin, axisMax])
      )
    ).sort((a, b) => a - b);
  }
  const formatXTick = (tk: number) => {
    if (tk === axisMin) return `≤${Math.abs(tk)}`;
    if (tk === axisMax) return `≥${Math.abs(tk)}`;
    return tk === 0 ? "0" : `${Math.abs(tk)}`;
  };

  // Tooltip background follows the side under the cursor: blue for a Dem
  // advantage (x < 0), red for a Rep advantage (x > 0), neutral for EVEN.
  // The EVEN swatch is inverted vs the gray bar so it stays readable in
  // both themes. Text inverts: white on the saturated light-mode bg, dark
  // navy on the pastel dark-mode bg (same treatment as Chamber Control).
  const evenTooltipFill = isDark
    ? NEUTRAL_GRAY_FILL_LIGHT
    : NEUTRAL_GRAY_FILL_DARK;
  const tooltipBgFill = ({ datum }: { datum?: { x: number } }) => {
    const x = datum?.x ?? 0;
    if (x < 0) return demStroke;
    if (x > 0) return repStroke;
    return evenTooltipFill;
  };
  const tooltipTextFill = isDark ? "#262f38" : "#ffffff";

  const formatTooltipLabel = ({
    datum,
  }: {
    datum: { x: number; y: number };
  }) => {
    const seats = Math.abs(Math.round(datum.x));
    const probability = datum.y.toFixed(1);
    const isOutOfBounds =
      separateOutOfBounds && (datum.x < rangeMin || datum.x > rangeMax);
    const line1 = isOutOfBounds
      ? t("midtermsHubSeatAdvantageOverTooltip", {
          count: Math.abs(Math.round(rangeMax)),
        })
      : datum.x === 0
        ? t("midtermsHubEvenTooltip")
        : t("midtermsHubSeatAdvantageTooltip", { count: seats });
    const line2 = t("midtermsHubProbabilityTooltip", { value: probability });
    return `${line1}\n${line2}`;
  };

  const tooltipComponent = (
    <VictoryTooltip
      cornerRadius={TOOLTIP_CORNER_RADIUS}
      flyoutPadding={TOOLTIP_FLYOUT_PADDING}
      flyoutStyle={{
        fill: tooltipBgFill,
        fillOpacity: HOVER_FLYOUT_OPACITY,
        stroke: "transparent",
      }}
      labelComponent={<VictoryLabel lineHeight={HOVER_TOOLTIP_LINE_HEIGHTS} />}
      style={[
        {
          fill: tooltipTextFill,
          fontSize: 16,
          fontWeight: 700,
          fontFamily: TEXT_FONT_FAMILY,
          fontVariantNumeric: "tabular-nums",
        },
        {
          fill: tooltipTextFill,
          fontSize: 14,
          fontWeight: 400,
          fontFamily: TEXT_FONT_FAMILY,
          fontVariantNumeric: "tabular-nums",
        },
      ]}
      pointerLength={TOOLTIP_POINTER_LENGTH}
      constrainToVisibleArea
    />
  );

  const medianTooltipComponent = (
    <VictoryTooltip
      // Always-on: this flyout is a static annotation, not a hover response.
      // The marker series is voronoi-blacklisted, so nothing ever overrides it.
      active
      cornerRadius={TOOLTIP_CORNER_RADIUS}
      flyoutPadding={TOOLTIP_FLYOUT_PADDING}
      flyoutStyle={{
        fill: medianInk,
        fillOpacity: MEDIAN_FLYOUT_OPACITY,
        stroke: "transparent",
      }}
      pointerLength={TOOLTIP_POINTER_LENGTH}
      constrainToVisibleArea
      // Must match MedianTooltipLabel's own text style — VictoryTooltip measures
      // this to size the flyout.
      style={{
        fontSize: MEDIAN_FONT_SIZE,
        fontWeight: 700,
        fontFamily: TEXT_FONT_FAMILY,
      }}
      labelComponent={
        <MedianTooltipLabel
          labelText={medianLabelText}
          valueText={medianValueText}
          labelFill={medianLabelFill}
          valueFill={medianValueFill}
        />
      }
    />
  );

  // Pixel position of x=0 inside the plot (accounting for the discrete
  // domain padding) — anchors the EVEN annotation over the gray bar.
  const domainPaddingX = isDiscrete ? DISCRETE_DOMAIN_PADDING_X : 0;
  const innerSpan = plotInnerWidth - 2 * domainPaddingX;
  const zeroPx =
    CHART_PADDING.left +
    domainPaddingX +
    (domainMax === domainMin
      ? innerSpan / 2
      : ((0 - domainMin) / (domainMax - domainMin)) * innerSpan);

  // EVEN annotation geometry: the label sits above the even bin with a short
  // connector down to it. Mirror Victory's y-scale (y=0 -> plotBottom,
  // y=yMax -> plotTop) to find the bin's top edge in pixels.
  const yMax = maxY > 0 ? maxY * 1.15 : 1;
  const plotBottom = CHART_HEIGHT - chartPadding.bottom;
  const plotHeight = plotBottom - chartPadding.top;
  const evenBinTopPx = evenBin
    ? chartPadding.top + (1 - (evenBin.y ?? 0) / yMax) * plotHeight
    : 0;
  const evenConnectorTopY = evenBin
    ? (evenBin.y ?? 0) + (EVEN_CONNECTOR_PX * yMax) / plotHeight
    : 0;

  const barFillOpacity = ({ active }: { active?: boolean }) =>
    active ? BAR_FILL_OPACITY_HOVER : BAR_FILL_OPACITY;
  const hoverBarOpacity = ({ active }: { active?: boolean }) =>
    active ? HOVER_BAR_ACTIVE_OPACITY : 0;

  return (
    <div
      className="relative w-full"
      ref={containerRef}
      aria-label={ariaTitle}
      // Safety net: Victory's onDeactivated doesn't reliably fire when the
      // pointer leaves the plot quickly, which would strand the median hidden.
      onMouseLeave={handlePointerLeave}
      role="img"
    >
      {/* Hard-edge linear gradient that snaps from dem fill to rep fill at
          x=0. Registered in a hidden <svg> so it lives in the document's
          defs scope and the Continuous (House) area can reference it. */}
      <svg
        width={0}
        height={0}
        style={{ position: "absolute", pointerEvents: "none" }}
        aria-hidden="true"
      >
        <defs>
          <linearGradient id={fillGradientId} x1="0" x2="1" y1="0" y2="0">
            <stop
              offset={zeroStopPct}
              stopColor={demFill}
              stopOpacity={AREA_FILL_OPACITY}
            />
            <stop
              offset={zeroStopPct}
              stopColor={repFill}
              stopOpacity={AREA_FILL_OPACITY}
            />
          </linearGradient>
          <linearGradient id={strokeGradientId} x1="0" x2="1" y1="0" y2="0">
            <stop offset={zeroStopPct} stopColor={demStroke} />
            <stop offset={zeroStopPct} stopColor={repStroke} />
          </linearGradient>
        </defs>
      </svg>

      {!!chartWidth && (
        <VictoryChart
          width={chartWidth}
          height={CHART_HEIGHT}
          padding={chartPadding}
          domain={{
            x: [domainMin, domainMax],
            y: [0, maxY > 0 ? maxY * 1.15 : 1],
          }}
          domainPadding={{ x: domainPaddingX }}
          containerComponent={
            <VictoryVoronoiContainer
              voronoiDimension="x"
              labels={formatTooltipLabel}
              labelComponent={tooltipComponent}
              mouseFollowTooltips={false}
              onActivated={handleBinActivated}
              onDeactivated={handleBinDeactivated}
              voronoiBlacklist={
                isDiscrete
                  ? [
                      "median-marker",
                      "even-connector",
                      "oob-divider-l",
                      "oob-divider-r",
                    ]
                  : ["median-marker", "area", "q-l", "q-m", "q-u"]
              }
              // Let the page scroll vertically through the chart on touch; the
              // chart only consumes horizontal moves (for the tooltip). Mirrors
              // the question-page forecast charts.
              style={{ touchAction: "pan-y" }}
            />
          }
        >
          {/* Discrete (Senate): neg / even / pos bar series, fill only. */}
          {isDiscrete && (
            <VictoryBar
              data={negBins}
              style={{ data: { fill: demFill, fillOpacity: barFillOpacity } }}
              barWidth={barWidth}
            />
          )}
          {isDiscrete && evenBin && (
            <VictoryBar
              data={[evenBin]}
              style={{
                data: { fill: neutralFill, fillOpacity: barFillOpacity },
              }}
              barWidth={barWidth}
            />
          )}
          {isDiscrete && (
            <VictoryBar
              data={posBins}
              style={{ data: { fill: repFill, fillOpacity: barFillOpacity } }}
              barWidth={barWidth}
            />
          )}

          {/* Continuous (House): one smooth area (per-seat density) with the
              dem→rep gradient so the color split lands at x=0. */}
          {!isDiscrete && (
            <VictoryArea
              name="area"
              data={curve}
              style={{
                data: {
                  fill: `url(#${fillGradientId})`,
                  stroke: `url(#${strokeGradientId})`,
                  strokeWidth: AREA_STROKE_WIDTH,
                },
              }}
              interpolation="monotoneX"
            />
          )}

          {/* Quartile dashes — Continuous only. Capped at the curve height. */}
          {!isDiscrete && (
            <VictoryLine
              name="q-l"
              data={[
                { x: quartileXs.lower25, y: 0 },
                { x: quartileXs.lower25, y: quartileYs.lower25 },
              ]}
              style={{
                data: {
                  stroke: axisColor,
                  strokeWidth: 1,
                  strokeDasharray: "3,3",
                },
              }}
            />
          )}
          {!isDiscrete && (
            <VictoryLine
              name="q-m"
              data={[
                { x: quartileXs.median, y: 0 },
                { x: quartileXs.median, y: quartileYs.median },
              ]}
              style={{
                data: {
                  stroke: axisColor,
                  strokeWidth: 1.5,
                  strokeDasharray: "3,3",
                },
              }}
            />
          )}
          {!isDiscrete && (
            <VictoryLine
              name="q-u"
              data={[
                { x: quartileXs.upper75, y: 0 },
                { x: quartileXs.upper75, y: quartileYs.upper75 },
              ]}
              style={{
                data: {
                  stroke: axisColor,
                  strokeWidth: 1,
                  strokeDasharray: "3,3",
                },
              }}
            />
          )}

          {/* Continuous (House): invisible whole-number bars that drive the
              tooltip and show a vertical hover bar (height = curve) when the
              cursor snaps to that seat. */}
          {!isDiscrete && (
            <VictoryBar
              name="tooltip"
              data={houseTooltipPoints}
              barWidth={HOVER_BAR_WIDTH}
              style={{
                data: { fill: hoverBarColor, fillOpacity: hoverBarOpacity },
              }}
            />
          )}

          {/* X axis: numeric ticks, colored by side (blue = Dem advantage,
              red = Rep advantage, neutral at EVEN). */}
          <VictoryAxis
            tickValues={xTicks}
            tickFormat={formatXTick}
            style={{
              axis: { stroke: axisColor, strokeWidth: 1 },
              ticks: { stroke: axisColor, size: 5 },
              tickLabels: {
                fill: (args: {
                  index?: string | number;
                  ticks?: Array<string | number>;
                }) => {
                  const v = Number(args.ticks?.[Number(args.index ?? 0)] ?? 0);
                  if (v < 0) return demStroke;
                  if (v > 0) return repStroke;
                  return tickColor;
                },
                fontSize: AXIS_FONT_SIZE,
                padding: 6,
                fontFamily: TEXT_FONT_FAMILY,
                fontVariantNumeric: "tabular-nums",
              },
            }}
          />

          {/* Y axis: percentages, pinned to the left padding edge. */}
          <VictoryAxis
            dependentAxis
            offsetX={CHART_PADDING.left}
            tickFormat={(tk: number) => `${tk.toFixed(0)}%`}
            style={{
              axis: { stroke: axisColor, strokeWidth: 1 },
              ticks: { stroke: axisColor, size: 4 },
              tickLabels: {
                fill: tickColor,
                fontSize: AXIS_FONT_SIZE,
                padding: 6,
                fontFamily: TEXT_FONT_FAMILY,
                fontVariantNumeric: "tabular-nums",
              },
              grid: { stroke: "transparent" },
            }}
          />

          {/* EVEN annotation — Discrete only. Label sits above the even bin
              with a short connector down to it. Rendered inside the SVG (not an
              HTML overlay) so the voronoi tooltip paints above it. */}
          {isDiscrete && evenBin && (
            <VictoryLine
              name="even-connector"
              data={[
                { x: 0, y: evenBin.y },
                { x: 0, y: evenConnectorTopY },
              ]}
              style={{ data: { stroke: tickColor, strokeWidth: 1 } }}
            />
          )}
          {isDiscrete && evenBin && (
            <VictoryLabel
              text={evenLabel}
              x={zeroPx}
              y={evenBinTopPx - EVEN_CONNECTOR_PX - 2}
              textAnchor="middle"
              verticalAnchor="end"
              style={{
                fill: evenTextColor,
                fontSize: 10,
                fontWeight: 700,
                letterSpacing: 1,
                fontFamily: TEXT_FONT_FAMILY,
              }}
            />
          )}

          {/* Out-of-bounds divider lines — House only. A thin vertical rule in
              the gap that detaches each landslide bin from the distribution. */}
          {isDiscrete && leftDividerX !== null && (
            <VictoryLine
              name="oob-divider-l"
              data={[
                { x: leftDividerX, y: 0 },
                { x: leftDividerX, y: yMax * OOB_DIVIDER_HEIGHT_FRAC },
              ]}
              style={{ data: { stroke: axisColor, strokeWidth: 1 } }}
            />
          )}
          {isDiscrete && rightDividerX !== null && (
            <VictoryLine
              name="oob-divider-r"
              data={[
                { x: rightDividerX, y: 0 },
                { x: rightDividerX, y: yMax * OOB_DIVIDER_HEIGHT_FRAC },
              ]}
              style={{ data: { stroke: axisColor, strokeWidth: 1 } }}
            />
          )}

          {/* Median marker — a dot on the x-axis at the median bin carrying an
              always-on flyout. Rendered last so it paints above the bars, and
              unmounted entirely while a bin is hovered so it never stacks with
              the hover tooltip. */}
          {!isBinHovered && (
            <VictoryScatter
              name="median-marker"
              data={[{ x: medianSeats, y: 0 }]}
              size={MEDIAN_MARKER_SIZE}
              style={{
                data: {
                  fill: medianInk,
                  // Ring in the card background so the dot separates from
                  // whatever bar it lands on.
                  stroke: chartBg,
                  strokeWidth: MEDIAN_MARKER_STROKE_WIDTH,
                },
              }}
              labels={() => `${medianLabelText} ${medianValueText}`}
              labelComponent={medianTooltipComponent}
            />
          )}

          {/* Chart title (SENATE / HOUSE) — rendered inside the SVG (not as an
              HTML overlay) so the voronoi tooltip paints above it. */}
          <VictoryLabel
            text={ariaTitle.toUpperCase()}
            x={52}
            y={14}
            textAnchor="start"
            verticalAnchor="start"
            style={{
              fill: tickColor,
              fontSize: 16,
              fontWeight: 700,
              letterSpacing: 0.5,
              fontFamily: TEXT_FONT_FAMILY,
            }}
          />
        </VictoryChart>
      )}

      {/* Party advantage labels — HTML overlay below the chart. Positioned in
          px since the SVG now renders at its true size. */}
      <div
        className="pointer-events-none absolute bottom-1 flex w-full font-sans text-xs font-semibold leading-tight"
        style={{
          left: 0,
          paddingLeft: CHART_PADDING.left,
          paddingRight: CHART_PADDING.right,
        }}
      >
        <span className="w-1/2 text-center" style={{ color: demStroke }}>
          {demAdvantageLabel}
        </span>
        <span className="w-1/2 text-center" style={{ color: repStroke }}>
          {repAdvantageLabel}
        </span>
      </div>
    </div>
  );
};

export default SeatDistributionChart;
