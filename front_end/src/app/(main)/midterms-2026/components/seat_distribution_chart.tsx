"use client";

import { FC, useMemo } from "react";
import {
  VictoryArea,
  VictoryAxis,
  VictoryBar,
  VictoryChart,
  VictoryLabel,
  VictoryLine,
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

const CHART_HEIGHT = 240;
const CHART_PADDING = { top: 12, right: 20, bottom: 64, left: 48 };

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

  // Split bins at x=0 — bins fully on one side go to that side; the rare
  // bin that straddles zero is assigned by its midpoint.
  const negBins = bins.filter((b) => b.x <= 0);
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

  const FILL_OPACITY = 0.5;
  const STROKE_WIDTH = 1.2;

  // For the Continuous area to meet cleanly at x=0, anchor each side
  // with a y=0 vertex at zero.
  const negArea = isDiscrete
    ? negBins
    : [...negBins, { x: 0, y: 0, xLeft: 0, xRight: 0 }];
  const posArea = isDiscrete
    ? posBins
    : [{ x: 0, y: 0, xLeft: 0, xRight: 0 }, ...posBins];

  // Axis tick math — handpick a few evenly spaced ticks on each side.
  const tickCount = 4;
  const negTicks: number[] = [];
  const posTicks: number[] = [];
  for (let i = 1; i <= tickCount; i++) {
    negTicks.push(domainMin + (-domainMin * (i - 1)) / tickCount);
    posTicks.push((domainMax * i) / tickCount);
  }
  const xTicks = Array.from(
    new Set(
      [...negTicks, 0, ...posTicks].map((t) =>
        // Round to integer where the domain is integer-y, else keep one
        // decimal — keeps Senate labels clean as 0, 3, 6, 9, 12 etc.
        Math.abs(t) >= 5 ? Math.round(t) : Math.round(t * 10) / 10
      )
    )
  ).sort((a, b) => a - b);

  // Format ticks as absolute values so both sides read e.g. "12 | 12"
  // instead of "-12 ... 12" (advantage is implied by the party label).
  const formatXTick = (t: number) => (t === 0 ? "0" : `${Math.abs(t)}`);

  return (
    <div className="w-full">
      <VictoryChart
        width={520}
        height={CHART_HEIGHT}
        padding={CHART_PADDING}
        domain={{ x: [domainMin, domainMax] }}
        domainPadding={{ x: isDiscrete ? 10 : 0 }}
      >
        <title>{ariaTitle}</title>

        {/* Negative-side fill — Dem advantage. */}
        {isDiscrete ? (
          <VictoryBar
            data={negBins}
            style={{
              data: {
                fill: demFill,
                fillOpacity: FILL_OPACITY,
                stroke: demStroke,
                strokeWidth: STROKE_WIDTH,
              },
            }}
            barRatio={0.85}
          />
        ) : (
          <VictoryArea
            data={negArea}
            style={{
              data: {
                fill: demFill,
                fillOpacity: FILL_OPACITY,
                stroke: demStroke,
                strokeWidth: STROKE_WIDTH,
              },
            }}
            interpolation="monotoneX"
          />
        )}

        {/* Positive-side fill — Rep advantage. */}
        {isDiscrete ? (
          <VictoryBar
            data={posBins}
            style={{
              data: {
                fill: repFill,
                fillOpacity: FILL_OPACITY,
                stroke: repStroke,
                strokeWidth: STROKE_WIDTH,
              },
            }}
            barRatio={0.85}
          />
        ) : (
          <VictoryArea
            data={posArea}
            style={{
              data: {
                fill: repFill,
                fillOpacity: FILL_OPACITY,
                stroke: repStroke,
                strokeWidth: STROKE_WIDTH,
              },
            }}
            interpolation="monotoneX"
          />
        )}

        {/* Quartile dashes — Continuous only. */}
        {!isDiscrete && (
          <>
            <VictoryLine
              data={[
                { x: quartileXs.lower25, y: 0 },
                { x: quartileXs.lower25, y: Math.max(...bins.map((b) => b.y)) },
              ]}
              style={{
                data: {
                  stroke: axisColor,
                  strokeWidth: 1,
                  strokeDasharray: "3,3",
                },
              }}
            />
            <VictoryLine
              data={[
                { x: quartileXs.median, y: 0 },
                { x: quartileXs.median, y: Math.max(...bins.map((b) => b.y)) },
              ]}
              style={{
                data: {
                  stroke: axisColor,
                  strokeWidth: 1.5,
                  strokeDasharray: "3,3",
                },
              }}
            />
            <VictoryLine
              data={[
                { x: quartileXs.upper75, y: 0 },
                { x: quartileXs.upper75, y: Math.max(...bins.map((b) => b.y)) },
              ]}
              style={{
                data: {
                  stroke: axisColor,
                  strokeWidth: 1,
                  strokeDasharray: "3,3",
                },
              }}
            />
          </>
        )}

        {/* X axis: numeric ticks + party labels below. */}
        <VictoryAxis
          tickValues={xTicks}
          tickFormat={formatXTick}
          style={{
            axis: { stroke: axisColor, strokeWidth: 1 },
            ticks: { stroke: axisColor, size: 5 },
            tickLabels: { fill: tickColor, fontSize: 11, padding: 6 },
          }}
        />

        {/* Y axis: percentages. */}
        <VictoryAxis
          dependentAxis
          tickFormat={(t: number) => `${t.toFixed(0)}%`}
          style={{
            axis: { stroke: axisColor, strokeWidth: 1 },
            ticks: { stroke: axisColor, size: 4 },
            tickLabels: { fill: tickColor, fontSize: 11, padding: 6 },
            grid: { stroke: "transparent" },
          }}
        />

        {/* Below-axis party labels. */}
        <VictoryLabel
          text={demAdvantageLabel}
          x={
            CHART_PADDING.left +
            (520 - CHART_PADDING.left - CHART_PADDING.right) / 4
          }
          y={CHART_HEIGHT - 14}
          textAnchor="middle"
          style={{
            fill: demStroke,
            fontSize: 11,
            fontWeight: 600,
          }}
        />
        <VictoryLabel
          text={repAdvantageLabel}
          x={
            CHART_PADDING.left +
            ((520 - CHART_PADDING.left - CHART_PADDING.right) * 3) / 4
          }
          y={CHART_HEIGHT - 14}
          textAnchor="middle"
          style={{
            fill: repStroke,
            fontSize: 11,
            fontWeight: 600,
          }}
        />

        {/* EVEN annotation — Discrete only, between -1 and +1 bars. */}
        {isDiscrete && (
          <VictoryLabel
            text={evenLabel}
            datum={{ x: 0, y: Math.max(...bins.map((b) => b.y)) * 0.6 }}
            textAnchor="middle"
            style={{
              fill: tickColor,
              fontSize: 10,
              fontWeight: 700,
              letterSpacing: 1,
            }}
          />
        )}
      </VictoryChart>
    </div>
  );
};

export default SeatDistributionChart;
