"use client";

import { FC, useId, useMemo } from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLine,
  VictoryTooltip,
  VictoryVoronoiContainer,
} from "victory";

import { PostWithForecasts } from "@/types/post";
import { QuestionType, QuestionWithNumericForecasts } from "@/types/question";
import {
  cdfToPmf,
  computeQuartilesFromCDF,
  scaleInternalLocation,
} from "@/utils/math";

import { MIDTERMS_COLORS } from "../constants";
import { useIsDark } from "../helpers/use_is_dark";

type Props = {
  post: PostWithForecasts;
  /** Localized "Democrat Seat Advantage" label rendered below the x-axis. */
  demAdvantageLabel: string;
  /** Localized "Republican Seat Advantage" label rendered below the x-axis. */
  repAdvantageLabel: string;
  /** Localized "EVEN" label rendered at x=0 on the Discrete (Senate) chart. */
  evenLabel: string;
  /** Hidden SVG <title> for screen readers. */
  ariaTitle: string;
};

// Bigger SVG so the chart fills its column instead of being centered
// with empty space on either side. The wrapper div is width:100% — the
// browser scales this SVG to its container while preserving aspect.
const CHART_WIDTH = 760;
const CHART_HEIGHT = 320;
const CHART_PADDING = { top: 16, right: 24, bottom: 56, left: 56 };

// Shared text style for every piece of SVG text inside the chart so
// the rendered fonts match the rest of the page (Inter via the CSS
// variables registered in the root layout).
const TEXT_FONT_FAMILY =
  "var(--font-inter-variable), var(--font-inter), Inter, system-ui, sans-serif";
const NEUTRAL_GRAY_FILL_LIGHT = "#D1D5DB";
const NEUTRAL_GRAY_FILL_DARK = "#475569";

type Bin = {
  /** Bin midpoint in real-world x units. */
  x: number;
  /** Probability mass in this bin (already in %). */
  y: number;
  xLeft: number;
  xRight: number;
};

const SeatDistributionChart: FC<Props> = ({
  post,
  demAdvantageLabel,
  repAdvantageLabel,
  evenLabel,
  ariaTitle,
}) => {
  const isDark = useIsDark();
  // Unique gradient ids — declared before any early return so the
  // useId hook stays in the same order across renders.
  const reactId = useId().replace(/:/g, "");
  const fillGradientId = `seat-fill-${reactId}`;
  const strokeGradientId = `seat-stroke-${reactId}`;

  const question = post.question as QuestionWithNumericForecasts | undefined;

  const data = useMemo(() => {
    if (!question) return null;
    const cdf =
      question.aggregations?.[question.default_aggregation_method]?.latest
        ?.forecast_values;
    if (!cdf || cdf.length < 2) return null;

    const pmf = cdfToPmf(cdf);
    const scale = question.scaling;
    const N = cdf.length;

    // PMF has N+1 entries — first/last cover open-bound overflow mass.
    // Map the in-range bins (1..N-1) to {x, y} where x is the bin midpoint
    // in real-world units (rescaled via the question's scaling) and y is
    // the probability mass expressed as a percentage.
    const bins: Bin[] = [];
    for (let i = 1; i < pmf.length - 1; i++) {
      const xLeft = scaleInternalLocation((i - 1) / (N - 1), scale);
      const xRight = scaleInternalLocation(i / (N - 1), scale);
      const yPct = (pmf[i] ?? 0) * 100;
      bins.push({ x: (xLeft + xRight) / 2, y: yPct, xLeft, xRight });
    }

    const domainMin = scale.range_min ?? bins[0]?.xLeft ?? 0;
    const domainMax = scale.range_max ?? bins[bins.length - 1]?.xRight ?? 0;

    // Quartile positions in real-world units (only used by the Continuous
    // chart). `computeQuartilesFromCDF` returns 0..1 internal locations.
    const isDiscrete = question.type === QuestionType.Discrete;
    const quartiles = computeQuartilesFromCDF(cdf, false, isDiscrete);
    const quartileXs = {
      median: scaleInternalLocation(quartiles.median, scale),
      lower25: scaleInternalLocation(quartiles.lower25, scale),
      upper75: scaleInternalLocation(quartiles.upper75, scale),
    };

    return { bins, domainMin, domainMax, isDiscrete, quartileXs };
  }, [question]);

  if (!data || !question) return null;

  const { bins, domainMin, domainMax, isDiscrete, quartileXs } = data;

  // Identify the "even" bin — the integer bar closest to zero. For the
  // Senate Discrete chart this is the standalone EVEN bin rendered in
  // neutral gray. For Continuous (House) we just use it as the splitter
  // and don't render a separate gray segment.
  const evenBinIndex = bins.reduce(
    (closestIdx, b, i) =>
      Math.abs(b.x) < Math.abs(bins[closestIdx]?.x ?? Infinity)
        ? i
        : closestIdx,
    0
  );
  const evenBin = bins[evenBinIndex];

  // Split bins at the even bin so neither side includes it. Bins on the
  // left of EVEN go blue (dem), bins on the right go red (rep), the
  // even bin renders separately in gray (Senate only).
  const negBins = bins.filter(
    (b, i) => i !== evenBinIndex && b.x < (evenBin?.x ?? 0)
  );
  const posBins = bins.filter(
    (b, i) => i !== evenBinIndex && b.x > (evenBin?.x ?? 0)
  );

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
  const neutralFill = isDark ? NEUTRAL_GRAY_FILL_DARK : NEUTRAL_GRAY_FILL_LIGHT;

  // Bars carry their identity through fill alone (no stroke — strokes
  // were making adjacent bars look like they were touching). Areas keep
  // their stroke as an outline since fill alone doesn't read on the
  // smooth Continuous curve.
  const BAR_FILL_OPACITY = 0.7;
  const BAR_FILL_OPACITY_HOVER = 1;
  const AREA_FILL_OPACITY = 0.5;
  const AREA_STROKE_WIDTH = 1.4;
  // Max bin height — used to size quartile dashes and the EVEN
  // annotation. Cached so we don't recompute it across renders.
  const maxY = bins.length ? Math.max(...bins.map((b) => b.y)) : 0;

  // Explicit bar width derived from the available plot area divided by
  // the bin count. Using `barRatio` alone meant Victory's auto-sizing
  // computed widths from data-point spacing, which is non-uniform when
  // the question's scale carries a non-null `zero_point` (logarithmic
  // stretch). With a fixed pixel width every integer bar is identical,
  // matching the upstream discrete histogram.
  const plotInnerWidth = CHART_WIDTH - CHART_PADDING.left - CHART_PADDING.right;
  const barWidth = isDiscrete
    ? Math.max(2, Math.floor((plotInnerWidth / bins.length) * 0.92))
    : undefined;

  // Where x=0 falls inside the plot, as a 0-1 fraction. Drives the
  // hard-edge gradient stop for the Continuous area fill+stroke so the
  // dem/rep color split happens exactly at x=0 without forcing the
  // curve to dip to y=0 there (the cause of the visible "0%" notch
  // before this fix).
  const zeroFraction =
    domainMax === domainMin ? 0.5 : (0 - domainMin) / (domainMax - domainMin);
  const zeroStopPct = `${(zeroFraction * 100).toFixed(2)}%`;

  // Axis tick math — handpick a few evenly spaced ticks on each side.
  // Always round to whole numbers and dedupe; the seat advantage is an
  // integer count so fractional ticks would never be meaningful.
  const tickCount = 4;
  const rawTicks: number[] = [0];
  for (let i = 1; i <= tickCount; i++) {
    rawTicks.push(domainMin + (-domainMin * (i - 1)) / tickCount);
    rawTicks.push((domainMax * i) / tickCount);
  }
  const xTicks = Array.from(new Set(rawTicks.map((t) => Math.round(t)))).sort(
    (a, b) => a - b
  );

  // Format ticks as absolute values so both sides read e.g. "12 | 12"
  // instead of "-12 ... 12" (advantage is implied by the party label).
  const formatXTick = (t: number) => (t === 0 ? "0" : `${Math.abs(t)}`);

  // Tooltip label formatter — same UX as the upstream prediction-input
  // cursor: shows the bin's x value and the community probability at
  // that point.
  const formatTooltipLabel = ({ datum }: { datum: { x: number; y: number } }) =>
    `${datum.x > 0 ? "+" : ""}${
      Number.isInteger(datum.x) ? datum.x : datum.x.toFixed(1)
    }\n${datum.y.toFixed(1)}%`;

  // Tooltip styled to match the Chamber Control hover tooltip — same
  // blue-800 / blue-800-dark inverted background, gray-0 text, and a
  // distinctly larger font than the chart's tick labels.
  // Light-mode bg: blue-800 (#2f4155); dark-mode bg: blue-800-dark
  // (#d7e7f7). Text inverts accordingly.
  const tooltipBgFill = isDark ? "#d7e7f7" : "#2f4155";
  const tooltipTextFill = isDark ? "#262f38" : "#ffffff";

  const tooltipComponent = (
    <VictoryTooltip
      cornerRadius={6}
      flyoutPadding={{ top: 12, bottom: 12, left: 16, right: 16 }}
      flyoutStyle={{
        fill: tooltipBgFill,
        stroke: "transparent",
      }}
      style={{
        fill: tooltipTextFill,
        fontSize: 20,
        fontWeight: 600,
        fontFamily: TEXT_FONT_FAMILY,
        fontVariantNumeric: "tabular-nums",
      }}
      pointerLength={10}
      constrainToVisibleArea
    />
  );

  // Center pixel of the plot area — used to anchor the EVEN annotation
  // on the Discrete (Senate) chart.
  const plotCenterX =
    (CHART_PADDING.left + (CHART_WIDTH - CHART_PADDING.right)) / 2;

  // Per-bar fillOpacity callback — Victory's voronoi container sets
  // `active: true` on the data point matching the cursor's x, so the
  // bar under the cursor lights up. Matches the prediction-input
  // discrete histogram's hover behavior.
  const barFillOpacity = ({ active }: { active?: boolean }) =>
    active ? BAR_FILL_OPACITY_HOVER : BAR_FILL_OPACITY;

  return (
    <div className="relative w-full" aria-label={ariaTitle} role="img">
      {/* Hard-edge linear gradient that snaps from dem fill to rep fill
          exactly at x=0. Registered in a hidden <svg> so it lives in
          the document's defs scope and other SVGs can reference it by
          id. Used by the Continuous (House) area below. */}
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

      <VictoryChart
        width={CHART_WIDTH}
        height={CHART_HEIGHT}
        padding={CHART_PADDING}
        domain={{ x: [domainMin, domainMax] }}
        domainPadding={{ x: isDiscrete ? 10 : 0 }}
        containerComponent={
          <VictoryVoronoiContainer
            voronoiDimension="x"
            labels={formatTooltipLabel}
            labelComponent={tooltipComponent}
            mouseFollowTooltips={false}
          />
        }
      >
        {/* Discrete (Senate): three VictoryBar series — neg / even /
            pos — each with its own solid fill and no stroke. Strokes
            were what made adjacent bars look like they were touching;
            without them, the bin-to-bin gap reads cleanly. */}
        {isDiscrete && (
          <VictoryBar
            data={negBins}
            style={{
              data: { fill: demFill, fillOpacity: barFillOpacity },
            }}
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
            style={{
              data: { fill: repFill, fillOpacity: barFillOpacity },
            }}
            barWidth={barWidth}
          />
        )}

        {/* Continuous (House): ONE area covering every bin. The fill and
            stroke use the dem→rep linear gradient defined above so the
            color split happens at x=0 without introducing a y=0 vertex
            (which used to produce a visible dip / "0%" notch). */}
        {!isDiscrete && (
          <VictoryArea
            data={bins}
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

        {/* Quartile dashes — Continuous only. Inlined as separate
            conditionals (no Fragment wrapper) so VictoryChart's child
            iteration walks each VictoryLine directly. */}
        {!isDiscrete && (
          <VictoryLine
            data={[
              { x: quartileXs.lower25, y: 0 },
              { x: quartileXs.lower25, y: maxY },
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
            data={[
              { x: quartileXs.median, y: 0 },
              { x: quartileXs.median, y: maxY },
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
            data={[
              { x: quartileXs.upper75, y: 0 },
              { x: quartileXs.upper75, y: maxY },
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

        {/* X axis: numeric ticks. */}
        <VictoryAxis
          tickValues={xTicks}
          tickFormat={formatXTick}
          style={{
            axis: { stroke: axisColor, strokeWidth: 1 },
            ticks: { stroke: axisColor, size: 5 },
            tickLabels: {
              fill: tickColor,
              fontSize: 11,
              padding: 6,
              fontFamily: TEXT_FONT_FAMILY,
              fontVariantNumeric: "tabular-nums",
            },
          }}
        />

        {/* Y axis: percentages. `offsetX` pins it to the left padding
            edge — without it, Victory would cross the X axis at its
            origin (x = 0), which is the middle of our signed domain. */}
        <VictoryAxis
          dependentAxis
          offsetX={CHART_PADDING.left}
          tickFormat={(t: number) => `${t.toFixed(0)}%`}
          style={{
            axis: { stroke: axisColor, strokeWidth: 1 },
            ticks: { stroke: axisColor, size: 4 },
            tickLabels: {
              fill: tickColor,
              fontSize: 11,
              padding: 6,
              fontFamily: TEXT_FONT_FAMILY,
              fontVariantNumeric: "tabular-nums",
            },
            grid: { stroke: "transparent" },
          }}
        />
      </VictoryChart>

      {/* Party advantage labels — HTML overlay below the chart so we
          don't need VictoryLabel at the top level of VictoryChart. */}
      <div
        className="pointer-events-none absolute bottom-1 flex w-full justify-around font-sans text-[11px] font-semibold"
        style={{
          left: 0,
          paddingLeft: `${(CHART_PADDING.left / CHART_WIDTH) * 100}%`,
          paddingRight: `${(CHART_PADDING.right / CHART_WIDTH) * 100}%`,
        }}
      >
        <span style={{ color: demStroke }}>{demAdvantageLabel}</span>
        <span style={{ color: repStroke }}>{repAdvantageLabel}</span>
      </div>

      {/* EVEN annotation — Discrete only. HTML overlay positioned over
          the gray center bar; rotated 90° so it reads top-to-bottom
          inside the narrow bar. */}
      {isDiscrete && (
        <span
          className="pointer-events-none absolute font-sans text-[10px] font-bold uppercase tracking-widest text-blue-700 dark:text-blue-700-dark"
          style={{
            // Position relative to the responsively-scaled SVG via
            // percentages of CHART_WIDTH.
            left: `${(plotCenterX / CHART_WIDTH) * 100}%`,
            top: "50%",
            transform: "translate(-50%, -50%) rotate(90deg)",
          }}
        >
          {evenLabel}
        </span>
      )}
    </div>
  );
};

export default SeatDistributionChart;
