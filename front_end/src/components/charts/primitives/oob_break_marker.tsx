"use client";
import React, { FC } from "react";

import { CHART_FONT_STYLE } from "@/constants/chart_typography";
import { METAC_COLORS } from "@/constants/colors";
import useAppTheme from "@/hooks/use_app_theme";

export type OobBreakMarkerDatum = {
  x?: number;
  y?: number;
  trueValue: number;
  formatValue: (value: number) => string;
  // Text color, matched to the series whose bar this labels.
  color?: string;
  // Position in the stack of labels sharing this bar's side (0 = lowest).
  // Each step lifts the label one line so overlapping series stay readable.
  stackIndex?: number;
};

const LABEL_BASELINE_OFFSET = 8;
// Vertical spacing between stacked labels; the chart also adds this much
// top padding per extra label.
export const OOB_BREAK_LABEL_LINE_HEIGHT = 12;

type Props = {
  x?: number;
  y?: number;
  datum?: unknown;
};

// The bar itself is drawn with a literal gap (see `getDiscreteBarPath` in
// continuous_area_chart.tsx) so the break reads as an absence of the bar.
// This marker only needs to label the bar's true (un-clamped) value, shown
// just above where the bar is cut off at the axis top.
const OobBreakMarker: FC<Props> = ({ x, y, datum }) => {
  const { getThemeColor } = useAppTheme();
  const d = datum as OobBreakMarkerDatum | undefined;
  if (x == null || y == null || !d) return null;

  const textColor = d.color ?? getThemeColor(METAC_COLORS.gray["600"]);
  const label = d.formatValue(d.trueValue);

  return (
    <text
      x={x}
      y={
        y -
        LABEL_BASELINE_OFFSET -
        (d.stackIndex ?? 0) * OOB_BREAK_LABEL_LINE_HEIGHT
      }
      textAnchor="middle"
      style={{
        ...CHART_FONT_STYLE.tick,
        fill: textColor,
      }}
      aria-label="True value of an out-of-bounds bar clamped to the axis top"
    >
      {label}
    </text>
  );
};

export default OobBreakMarker;
