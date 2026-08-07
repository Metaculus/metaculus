"use client";
import React, { FC } from "react";

import { CHART_FONT_STYLE } from "@/constants/chart_typography";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

export type OobBreakMarkerDatum = {
  x?: number;
  y?: number;
  barWidth: number;
  trueValue: number;
  // Pre-resolved (already themed) fill color, used to visually mask the bar
  // segment behind the zigzag so the break reads as separated.
  fill?: string;
  formatValue: (value: number) => string;
};

type Props = {
  x?: number;
  y?: number;
  datum?: unknown;
};

const OobBreakMarker: FC<Props> = ({ x, y, datum }) => {
  const { getThemeColor } = useAppTheme();
  const d = datum as OobBreakMarkerDatum | undefined;
  if (x == null || y == null || !d) return null;

  const halfWidth = Math.max(4, d.barWidth / 2);
  // A slightly wider bracket, tucked ~2px above the clamped bar top so the
  // zigzag reads as an axis break on the bar rather than as data.
  const anchorY = y - 2;
  const step = halfWidth / 2;
  const zigzagAmplitude = 3;
  const strokeColor = getThemeColor(METAC_COLORS.gray["600"]);
  const fillColor = d.fill ?? getThemeColor(METAC_COLORS.gray["0"]);

  // Two parallel zigzag lines with a thin band between them so the bar visually
  // "breaks" (the space between reads as the removed section of axis).
  const bandHalf = 2;
  const upperY = anchorY - bandHalf;
  const lowerY = anchorY + bandHalf;
  const buildPath = (baseY: number) =>
    `M ${x - halfWidth},${baseY}` +
    ` L ${x - halfWidth + step},${baseY - zigzagAmplitude}` +
    ` L ${x},${baseY + zigzagAmplitude}` +
    ` L ${x + halfWidth - step},${baseY - zigzagAmplitude}` +
    ` L ${x + halfWidth},${baseY}`;

  const label = d.formatValue(d.trueValue);
  const labelY = upperY - zigzagAmplitude - 6;

  return (
    <g aria-label="Y-axis break marker for out-of-bounds bar">
      {/* Mask out the bar section behind the break with the chart background
          color so the two zigzag strokes read as separated. */}
      <rect
        x={x - halfWidth - 1}
        y={upperY - zigzagAmplitude}
        width={halfWidth * 2 + 2}
        height={lowerY - upperY + 2 * zigzagAmplitude}
        fill={fillColor}
      />
      <path
        d={buildPath(upperY)}
        stroke={strokeColor}
        strokeWidth={1}
        fill="none"
      />
      <path
        d={buildPath(lowerY)}
        stroke={strokeColor}
        strokeWidth={1}
        fill="none"
      />
      <text
        x={x}
        y={labelY}
        textAnchor="middle"
        style={{
          ...CHART_FONT_STYLE.tick,
          fill: strokeColor,
        }}
      >
        {label}
      </text>
    </g>
  );
};

export default OobBreakMarker;
